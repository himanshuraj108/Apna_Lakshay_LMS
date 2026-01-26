try {
    console.log('1. Loading server...');
    const app = require('./server'); // This triggers all requires (routes, controllers, models)
    console.log('✅ Server loaded successfully');

    // If we reached here, modules are fine.
    // We can exit now.
    process.exit(0);

} catch (error) {
    console.error('❌ CRASH DETECTED ON STARTUP:');
    console.error(error);
    process.exit(1);
}
