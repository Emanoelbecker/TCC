const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const authMiddleware = require('./middleware/authMiddleware');
const authRoutes = require('./routes/authRoutes');
const indexRoutes = require('./routes/indexRoutes');
const userRoutes = require('./routes/userRoutes');
const produtoRoutes = require('./routes/produtoRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const seedTestUser = require('./utils/seedTestUser');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(expressLayouts);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.use(session({
    secret: process.env.SESSION_SECRET || 'change_this_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60, // 1 hora
    },
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.successMessage = req.session.successMessage || null;
    delete req.session.successMessage;
    next();
});

seedTestUser();

app.use('/', authRoutes);
app.use('/', authMiddleware.ensureAuthenticated, indexRoutes);
app.use('/users', authMiddleware.ensureAuthenticated, userRoutes);
app.use('/produtos', authMiddleware.ensureAuthenticated, produtoRoutes);
app.use('/categorias', authMiddleware.ensureAuthenticated, categoriaRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
