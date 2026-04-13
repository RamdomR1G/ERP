const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const validateSchema = require('../middlewares/validate');
const authMiddleware = require('../middlewares/auth');
const { CreateTicketSchema, UpdateTicketSchema } = require('../schemas/ticket.schema');

router.get('/', authMiddleware, ticketController.getTickets);
router.get('/:id', authMiddleware, ticketController.getTicketById);
router.post('/', authMiddleware, validateSchema(CreateTicketSchema), ticketController.createTicket);
router.put('/:id', authMiddleware, validateSchema(UpdateTicketSchema), ticketController.updateTicket);
router.delete('/:id', authMiddleware, ticketController.deleteTicket);

module.exports = router;
