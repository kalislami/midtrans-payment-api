import app from './app';
import { sequelize } from './config/database';

const PORT = process.env.PORT ?? 3000;

sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});