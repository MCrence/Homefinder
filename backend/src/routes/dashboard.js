import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = express.Router();

// Get dashboard data
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let stats = {};
    let recentAppointments = [];
    
    if (userRole === 'renter') {
      // Get stats for renter
      const appointmentsCount = await query(`
        SELECT COUNT(*) as total FROM appointments WHERE renter_id = ?
      `, [userId]);
      
      const upcomingAppointments = await query(`
        SELECT COUNT(*) as total FROM appointments 
        WHERE renter_id = ? AND date >= CURDATE() AND status = 'confirmed'
      `, [userId]);
      
      const completedAppointments = await query(`
        SELECT COUNT(*) as total FROM appointments 
        WHERE renter_id = ? AND status = 'completed'
      `, [userId]);
      
      const availableApartments = await query(`
        SELECT COUNT(*) as total FROM apartments WHERE is_available = TRUE
      `);

      const totalApartments = await query(`
        SELECT COUNT(*) as total FROM apartments
      `);
      
      stats = {
        appointments: appointmentsCount[0].total,
        upcomingAppointments: upcomingAppointments[0].total,
        completedAppointments: completedAppointments[0].total,
        apartments: availableApartments[0].total,
        totalApartments: totalApartments[0].total
      };
      
      // Get recent appointments for renter
      recentAppointments = await query(`
        SELECT a.id, a.date, a.time, a.status, apt.title, apt.location,
        o.name as owner_name
        FROM appointments a
        JOIN apartments apt ON a.apartment_id = apt.id
        JOIN users o ON apt.owner_id = o.id
        WHERE a.renter_id = ?
        ORDER BY a.created_at DESC
        LIMIT 5
      `, [userId]);
    } else {
      // Get stats for property owner
      const propertiesCount = await query(`
        SELECT COUNT(*) as total FROM apartments WHERE owner_id = ?
      `, [userId]);
      
      const appointmentsCount = await query(`
        SELECT COUNT(*) as total FROM appointments a
        JOIN apartments apt ON a.apartment_id = apt.id
        WHERE apt.owner_id = ?
      `, [userId]);
      
      const upcomingAppointments = await query(`
        SELECT COUNT(*) as total FROM appointments a
        JOIN apartments apt ON a.apartment_id = apt.id
        WHERE apt.owner_id = ? AND a.date >= CURDATE() AND a.status = 'confirmed'
      `, [userId]);
      
      const totalRenters = await query(`
        SELECT COUNT(DISTINCT renter_id) as total FROM appointments a
        JOIN apartments apt ON a.apartment_id = apt.id
        WHERE apt.owner_id = ?
      `, [userId]);

      const totalApartments = await query(`
        SELECT COUNT(*) as total FROM apartments
      `);
      
      stats = {
        apartments: propertiesCount[0].total,
        appointments: appointmentsCount[0].total,
        upcomingAppointments: upcomingAppointments[0].total,
        completedAppointments: totalRenters[0].total, // Using completedAppointments field for total visitors
        totalApartments: totalApartments[0].total
      };
      
      // Get recent appointments for property owner
      recentAppointments = await query(`
        SELECT a.id, a.date, a.time, a.status, apt.title, apt.location,
        r.name as renter_name
        FROM appointments a
        JOIN apartments apt ON a.apartment_id = apt.id
        JOIN users r ON a.renter_id = r.id
        WHERE apt.owner_id = ?
        ORDER BY a.created_at DESC
        LIMIT 5
      `, [userId]);
    }
    
    res.status(200).json({
      stats,
      recentAppointments
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;