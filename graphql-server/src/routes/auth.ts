import express, { Router } from 'express';

const router = Router();

router.use(express.urlencoded({ extended: false }));
router.use(express.json());

router.post('/', async (req, res) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) {
//       return res.status(401).json({ error: 'No token provided' });
//     }

//     const decoded = await verifyToken({ req, res });
//     if (!decoded) {
//       return res.status(401).json({ error: 'Invalid token' });
//     }

//     return res.status(200).json({ 
//       authenticated: true,
//       userId: decoded.sub 
//     });
//   } catch (error) {
//     return res.status(401).json({ 
//       error: 'Authentication failed',
//       details: error.message 
//     });
//   }
});

export default router;