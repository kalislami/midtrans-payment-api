import app from './app';
import { sequelize } from './config/database';

const PORT = process.env.PORT ?? 3000;

sequelize.authenticate().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(() => {
    console.error('Database connection failed');
    process.exit(1);
});
