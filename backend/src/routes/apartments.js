import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyToken, checkRole } from '../middleware/auth.js';
import { query } from '../config/database.js';
import fs from 'fs';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/apartments');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Ensure the upload directory exists
const uploadPath = path.join(__dirname, '../../uploads/apartments');
try {
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
} catch (error) {
  console.error('Error creating upload directory:', error);
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(new Error('Only .jpeg, .jpg, .png, and .webp files are allowed'));
  }
}).array('images', 10);

// Get all apartments
router.get('/', async (req, res) => {
  try {
    const apartments = await query(`
      SELECT a.*,
        CONCAT(
          '${process.env.VITE_API_URL}',
          '/uploads/apartments/',
        COALESCE(
          (SELECT image_url FROM apartment_images WHERE apartment_id = a.id AND is_primary = TRUE LIMIT 1),
          'default-apartment.jpg'
        )
      ) AS primary_image
      FROM apartments a
      ORDER BY a.created_at DESC
    `);
    res.status(200).json(apartments);
  } catch (error) {
    console.error('Error fetching apartments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Book an apartment
router.post('/book', verifyToken, async (req, res) => {
  try {
    const { apartment_id, date, notes } = req.body;
    const renter_id = req.user.id;

    // Check if the apartment is already rented
    const rentedApartments = await query(`
      SELECT * FROM appointments 
      WHERE apartment_id = ? AND status = 'confirmed'
    `, [apartment_id]);

    if (rentedApartments.length > 0) {
      return res.status(400).json({ message: 'This apartment is already rented and cannot be booked.' });
    }

    // Proceed with booking
    const result = await query(`
      INSERT INTO appointments (apartment_id, renter_id, date, notes, status)
      VALUES ( ?, ?, ?, 'pending')
    `, [apartment_id, renter_id, date, notes]);

    res.status(201).json({ message: 'Appointment booked successfully', appointmentId: result.insertId });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new apartment (property owners only)
router.post('/', verifyToken, checkRole(['admin', 'owner']), upload, async (req, res) => {
  try {
    console.log('Uploaded files:', req.files);
    console.log('Request body:', req.body);

    const { title, description, location, price, bedrooms, bathrooms, area } = req.body;

    // Validate required fields
    if (!title || !description || !location || !price || !bedrooms || !bathrooms || !area) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Insert apartment into database
    const result = await query(`
      INSERT INTO apartments (owner_id, title, description, location, price, bedrooms, bathrooms, area, is_available)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
    `, [req.user.id, title, description, location, price, bedrooms, bathrooms, area]);

    const apartmentId = result.insertId;

    // Process uploaded images
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const isPrimary = i === 0; // First image is primary
        await query(
          'INSERT INTO apartment_images (apartment_id, image_url, is_primary) VALUES (?, ?, ?)',
          [apartmentId, req.files[i].filename, isPrimary]
        );
      }
    }

    res.status(201).json({
      message: 'Apartment created successfully',
      apartmentId
    });
  } catch (error) {
    console.error('Error creating apartment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH status only
router.patch('/:id/status', verifyToken, checkRole(['admin', 'owner']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    // Check if apartment exists and belongs to the user
    const apartments = await query(
      `SELECT * FROM apartments WHERE id = ? AND owner_id = ?`,
      [id, req.user.id]
    );
    if (apartments.length === 0) {
      return res.status(404).json({ message: 'Apartment not found or you do not have permission' });
    }

    await query(
      `UPDATE apartments SET status=? WHERE id=?`,
      [status, id]
    );

    res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an apartment (property owners only)
router.put('/:id', verifyToken, checkRole(['admin', 'owner']), upload, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, location, price,
      bedrooms, bathrooms, area, is_available, status
    } = req.body;

    // Check if apartment exists and belongs to the user
    const apartments = await query(
      `SELECT * FROM apartments WHERE id = ? AND owner_id = ?`,
      [id, req.user.id]
    );
    if (apartments.length === 0) {
      return res.status(404).json({ message: 'Apartment not found or you do not have permission' });
    }

    // Update apartment, including status
    await query(
      `UPDATE apartments SET title=?, description=?, location=?, price=?, bedrooms=?, bathrooms=?, area=?, is_available=?, status=? WHERE id=?`,
      [title, description, location, price, bedrooms, bathrooms, area, is_available ?? null, status ?? null, id]
    );

    // If new images uploaded, update images
    if (req.files && req.files.length > 0) {
      await query('DELETE FROM apartment_images WHERE apartment_id = ?', [id]);
      for (let i = 0; i < req.files.length; i++) {
        const isPrimary = i === 0;
        await query(
          'INSERT INTO apartment_images (apartment_id, image_url, is_primary) VALUES (?, ?, ?)',
          [id, req.files[i].filename, isPrimary]
        );
      }
    }

    res.status(200).json({ message: 'Apartment updated successfully' });
  } catch (error) {
    console.error('Error updating apartment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an apartment (property owners only)
router.delete('/:id', verifyToken, checkRole(['admin', 'owner']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if apartment exists and belongs to the user
    const apartments = await query(`
      SELECT * FROM apartments WHERE id = ? AND owner_id = ?
    `, [id, req.user.id]);

    if (apartments.length === 0) {
      return res.status(404).json({ message: 'Apartment not found or you do not have permission' });
    }

    // Delete apartment from database
    await query('DELETE FROM apartments WHERE id = ?', [id]);

    res.status(200).json({ message: 'Apartment deleted successfully' });
  } catch (error) {
    console.error('Error deleting apartment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get apartments for property owner
router.get('/owner/properties', verifyToken, checkRole(['admin', 'owner']), async (req, res) => {
  try {
    const apartments = await query(`
      SELECT a.*,
      CONCAT('${process.env.VITE_API_URL}',
        '/uploads/apartments/',
        COALESCE(
          (SELECT image_url FROM apartment_images WHERE apartment_id = a.id AND is_primary = TRUE LIMIT 1),
          'default-apartment.jpg'
        )
      ) AS primary_image
      FROM apartments a
      WHERE a.owner_id = ?
      ORDER BY a.created_at DESC
    `, [req.user.id]);

    res.status(200).json(apartments);
  } catch (error) {
    console.error('Error fetching owner properties:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get popular/recently rented apartments (for renters dashboard)
router.get('/popular', async (req, res) => {
  try {
    const apartments = await query(`
      SELECT 
        a.id,
        a.title,
        a.location,
        a.price,
        a.bedrooms,
        a.bathrooms,
        a.area,
        COUNT(appts.id) AS rented_count,
        CONCAT(
          '${process.env.VITE_API_URL}',
          '/uploads/apartments/',
          COALESCE(
            (SELECT image_url FROM apartment_images WHERE apartment_id = a.id AND is_primary = TRUE LIMIT 1),
            'default-apartment.jpg'
          )
        ) AS primary_image
      FROM apartments a
      LEFT JOIN appointments appts
        ON appts.apartment_id = a.id AND appts.status = 'confirmed'
      WHERE a.status = 'unavailable' OR a.status = 'maintenance'
      GROUP BY a.id
      ORDER BY rented_count DESC, a.updated_at DESC
      LIMIT 6
    `);

    res.status(200).json(apartments);
  } catch (error) {
    console.error('Error fetching popular apartments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get apartments recently rented by the current renter
router.get('/rented-by-me', verifyToken, async (req, res) => {
  try {
    // Only renters can use this endpoint
    if (req.user.role !== 'renter') {
      return res.status(403).json({ message: 'Only renters can view their rented apartments.' });
    }

    const apartments = await query(`
      SELECT 
        a.id,
        a.title,
        a.location,
        a.price,
        a.bedrooms,
        a.bathrooms,
        a.area,
        appts.date AS rented_date,
        CONCAT(
          '${process.env.VITE_API_URL}',
          '/uploads/apartments/',
          COALESCE(
            (SELECT image_url FROM apartment_images WHERE apartment_id = a.id AND is_primary = TRUE LIMIT 1),
            'default-apartment.jpg'
          )
        ) AS primary_image
      FROM apartments a
      JOIN appointments appts ON appts.apartment_id = a.id
      WHERE appts.renter_id = ? AND appts.status = 'confirmed'
      ORDER BY appts.date DESC
      LIMIT 10
    `, [req.user.id]);

    res.status(200).json(apartments);
  } catch (error) {
    console.error('Error fetching recent rented apartments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;