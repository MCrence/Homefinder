import express from 'express';
import { body } from 'express-validator';
import { verifyToken, checkRole } from '../middleware/auth.js';
import { query } from '../config/database.js';
import { validationResult } from 'express-validator';

const router = express.Router();

// Get all appointments for current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let appointments;
    
    if (userRole === 'renter') {
      // Get renter's appointments
      appointments = await query(`
        SELECT a.*, apt.title, apt.location, apt.price,
          o.name as owner_name, o.email as owner_email,
          CONCAT(
            '${process.env.VITE_API_URL}',
            '/uploads/apartments/',
            COALESCE(
              (SELECT image_url FROM apartment_images WHERE apartment_id = apt.id AND is_primary = TRUE LIMIT 1),
              'default-apartment.jpg'
            )
          ) as image
        FROM appointments a
        JOIN apartments apt ON a.apartment_id = apt.id
        JOIN users o ON apt.owner_id = o.id
        WHERE a.renter_id = ?
        ORDER BY a.date DESC, a.time DESC
      `, [userId]);
    } else {
      // Get owner's appointments
      appointments = await query(`
        SELECT a.*, apt.title, apt.location, apt.price,
          r.name as renter_name, r.email as renter_email,
          CONCAT(
            '${process.env.VITE_API_URL}',
            '/uploads/apartments/',
            COALESCE(
              (SELECT image_url FROM apartment_images WHERE apartment_id = apt.id AND is_primary = TRUE LIMIT 1),
              'default-apartment.jpg'
            )
          ) as image
        FROM appointments a
        JOIN apartments apt ON a.apartment_id = apt.id
        JOIN users r ON a.renter_id = r.id
        WHERE apt.owner_id = ?
        ORDER BY a.date DESC, a.time DESC
      `, [userId]);
    }
    
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new appointment
router.post('/', [
  body('apartment_id').isInt().withMessage('Apartment ID is required'),
  body('date').isDate().withMessage('Valid date is required'),
  body('time').optional(),
  body('notes').optional(),
], async (req, res) => {
  try {

    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { apartment_id, date, notes } = req.body;
    const now = new Date();
    const time = now.toTimeString().slice(0,5);
    const renter_id = req.user.id;
    
    // Check if user is a renter
    if (req.user.role !== 'renter') {
      return res.status(403).json({ message: 'Only renters can schedule appointments' });
    }
    
    // Get apartment details to find the owner
    const apartments = await query(`
      SELECT * FROM apartments WHERE id = ?
    `, [apartment_id]);
    
    if (apartments.length === 0) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    
    const apartment = apartments[0];
    const owner_id = apartment.owner_id;
    
    // Check if the apartment is available
    if (!apartment.is_available) {
      return res.status(400).json({ message: 'This apartment is not available for viewing' });
    }
    // Apartment Validation
    const rented = await query(`
      SELECT * FROM appointments 
      WHERE apartment_id = ? AND status = 'confirmed'
    `, [apartment_id]);
    if (rented.length > 0) {
      return res.status(400).json({ message: 'This apartment is already rented and cannot be booked.' });
    }

    // Create appointment
    const result = await query(`
      INSERT INTO appointments (apartment_id, renter_id, owner_id, date, time, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [apartment_id, renter_id, owner_id, date, time, notes]);
    
    res.status(201).json({
      message: 'Appointment scheduled successfully',
      appointmentId: result.insertId
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update appointment status
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, date, time } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get appointment details
    const appointments = await query(`
      SELECT * FROM appointments WHERE id = ?
    `, [id]);

    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appointment = appointments[0];

    // Permission checks
    if (userRole === 'renter' && appointment.renter_id !== userId) {
      return res.status(403).json({ message: 'You do not have permission to update this appointment' });
    }
    if (userRole === 'owner' && appointment.owner_id !== userId) {
      return res.status(403).json({ message: 'You do not have permission to update this appointment' });
    }

    // Handle status update
    if (status) {
      if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      // Renters can only cancel if appointment is pending
      if (userRole === 'renter') {
        if (status !== 'cancelled') {
          return res.status(403).json({ message: 'Renters can only cancel appointments' });
        }
        if (appointment.status !== 'pending') {
          return res.status(400).json({ message: 'You can only cancel pending appointments.' });
        }
      }
      // Only allow reschedule/cancel when pending
      if (
        (status === 'cancelled' || status === 'confirmed') &&
        appointment.status !== 'pending'
      ) {
        return res.status(400).json({ message: 'You can only confirm or cancel pending appointments.' });
      }
      await query(`UPDATE appointments SET status = ? WHERE id = ?`, [status, id]);

      // If confirming, set apartment to unavailable
      if (status === 'confirmed') {
      await query(
        `UPDATE apartments SET status = 'unavailable', is_available = FALSE WHERE id = ?`,
        [appointment.apartment_id]
      );
      // Cancel all other pending appointments for this apartment
      await query(
        `UPDATE appointments SET status = 'cancelled' WHERE apartment_id = ? AND status = 'pending' AND id != ?`,
        [appointment.apartment_id, id]
      );
    }

      return res.status(200).json({ message: 'Appointment status updated successfully' });
    }

    // Handle reschedule (date/time)
    if (date || time) {
      // Only allow rescheduling if appointment is pending
      if (appointment.status !== 'pending') {
        return res.status(400).json({ message: 'You can only reschedule pending appointments.' });
      }
      await query(
        `UPDATE appointments SET date = COALESCE(?, date), time = COALESCE(?, time) WHERE id = ?`,
        [date ?? null, time ?? null, id]
      );
      return res.status(200).json({ message: 'Appointment rescheduled successfully' });
    }

    return res.status(400).json({ message: 'No valid fields to update' });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Delete appointment (only for pending appointments)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Get appointment details
    const appointments = await query(`
      SELECT a.*, apt.owner_id
      FROM appointments a
      JOIN apartments apt ON a.apartment_id = apt.id
      WHERE a.id = ?
    `, [id]);
    
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    const appointment = appointments[0];
    
    // Check permission to delete
    if (appointment.renter_id !== userId && appointment.owner_id !== userId) {
      return res.status(403).json({ message: 'You do not have permission to delete this appointment' });
    }
    
    // Only pending appointments can be deleted
    if (appointment.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending appointments can be deleted' });
    }
    
    // Delete appointment
    await query('DELETE FROM appointments WHERE id = ?', [id]);
    
    res.status(200).json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;