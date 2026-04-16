const mongoose = require('mongoose');
const { Schema } = mongoose;

const invoiceSchema = new Schema({
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    
    invoiceCode: { type: String, required: true, unique: true }, // e.g., INV-20260316-001
    
    roomCharge: { type: Number, required: true },
    extraFee: { type: Number, default: 0 }, // Additional charges (water, damages, etc.)
    totalAmount: { type: Number, required: true },
    
    paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
    paidAt: { type: Date }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Invoice', invoiceSchema);