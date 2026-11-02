const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const authMiddleware = require('./middlewares/authMiddleware');
const csrfProtection = require('./middlewares/csrfMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const indexRoutes = require('./routes/indexRoutes');
const userRoutes = require('./routes/userRoutes');
const produtoRoutes = require('./routes/produtoRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const vendaRoutes = require('./routes/vendaRoutes');
const seedTestUser = require('./services/seedTestUser');

const app = express();
const PORT = process.env.PORT || 3000;
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET deve ser configurado com pelo menos 32 caracteres.');
}

if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60, // 1 hora
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    },
}));
app.use(csrfProtection);

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.csrfToken = req.session.csrfToken;
    res.locals.successMessage = req.session.successMessage || null;
    res.locals.errorMessage = req.session.errorMessage || null;
    delete req.session.successMessage;
    delete req.session.errorMessage;
    next();
});

if (process.env.SEED_TEST_USER === 'true') {
    seedTestUser();
}

app.get('/test', (req, res) => {
    res.status(200).send('Servidor Express funcionando!');
});

app.use('/', authRoutes);
app.use(['/dashboard', '/clientes', '/produtos', '/vendas'], authMiddleware.ensureAuthenticated);
app.use('/', indexRoutes);
app.use('/users', authMiddleware.ensureAuthenticated, userRoutes);
app.use('/produtos', produtoRoutes);
app.use('/clientes', clienteRoutes);
app.use('/vendas', vendaRoutes);
app.use(errorMiddleware.notFoundHandler);
app.use(errorMiddleware.errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
