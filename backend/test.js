// Test script to check which module fails to load
try {
    console.log('Testing module imports...');

    require('dotenv').config();
    console.log('✅ dotenv loaded');

    const express = require('express');
    console.log('✅ express loaded');

    const mongoose = require('mongoose');
    console.log('✅ mongoose loaded');

    const authRoutes = require('./routes/authRoutes');
    console.log('✅ authRoutes loaded');

    const studentRoutes = require('./routes/studentRoutes');
    console.log('✅ studentRoutes loaded');

    const publicRoutes = require('./routes/publicRoutes');
    console.log('✅ publicRoutes loaded');

    const adminRoutes = require('./routes/adminRoutes');
    console.log('✅ adminRoutes loaded');

    console.log('\n✅ All modules loaded successfully!');
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
}
