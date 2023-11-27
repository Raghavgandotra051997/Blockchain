const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const passport = require('passport');
const httpStatus = require('http-status');
const config = require('./config/config');
const morgan = require('./config/morgan');
const { jwtStrategy } = require('./config/passport');
const { authLimiter } = require('./middlewares/rateLimiter');
const routes = require('./routes/v1');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');
const { Gateway, Wallets } = require('fabric-network');
const app = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options('*', cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// v1 api routes
app.use('/v1', routes);


const ccpPath = path.resolve(__dirname, '..', '..', 'first-network', 'connection-org1.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

// Function to connect to the network
async function connectToNetwork() {
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'yourIdentity', discovery: { enabled: true, asLocalhost: true } });
    return gateway;
}

// API to Get Patient
app.get('/patient/:id', async (req, res) => {
    try {
        const gateway = await connectToNetwork();
        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('EMRSmartContract');

        const result = await contract.evaluateTransaction('GetPatient', req.params.id);
        res.json(JSON.parse(result.toString()));
        gateway.disconnect();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
pp.get('/queryRecords/:id', async (req, res) => {
    try {
        const gateway = await connectToNetwork();
        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('EMRSmartContract');

        const result = await contract.evaluateTransaction('QueryRecords', req.params.id,reqs.params.userid);
        res.json(JSON.parse(result.toString()));
        gateway.disconnect();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// API to Initialize Ledger
app.post('/initLedger', async (req, res) => {
    try {
        const gateway = await connectToNetwork();
        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('EMRSmartContract');

        const result = await contract.submitTransaction('InitLedger', req.body.numberOfRecords);
        res.json({ result: JSON.parse(result.toString()) });
        gateway.disconnect();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API to Authorize Doctor
app.post('/authorizeDoctor', async (req, res) => {
    const { patientId, doctorId } = req.body;
    try {
        const gateway = await connectToNetwork();
        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('EMRSmartContract');

        await contract.submitTransaction('AuthorizeDoctor', patientId, doctorId);
        res.json({ message: 'Doctor authorized successfully' });
        gateway.disconnect();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
