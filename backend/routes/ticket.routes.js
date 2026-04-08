const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const validateSchema = require('../middlewares/validate');
const { CreateTicketSchema, UpdateTicketSchema } = require('../schemas/ticket.schema');

router.get('/', ticketController.getTickets);
router.get('/:id', ticketController.getTicketById);
router.post('/', validateSchema(CreateTicketSchema), ticketController.createTicket);
router.put('/:id', validateSchema(UpdateTicketSchema), ticketController.updateTicket);
router.delete('/:id', ticketController.deleteTicket);

module.exports = router;
