# quickService
___
\
This is a server-side application in Node.js using Express web application framework and and Mongoose ODM, generated using Appinvento.

## Requirements
___

- **Node.js** : Node.js is an open-source server environment. Node.js is cross-platform and runs on Windows, Linux, Unix, and macOS. Node.js is a back-end JavaScript runtime environment.
- **MongoDB** : MongoDB is a source-available cross-platform document-oriented database program. Classified as a NoSQL database program, MongoDB uses JSON-like documents with optional schemas.
- **Redis** : Redis is an open source, in-memory data structure store used as a database, cache, message broker, and streaming engine
- **Docker** : Docker is a set of platform as a service products that use OS-level virtualization to deliver software in packages called containers. The service has both free and premium tiers.
               The software that hosts the containers is called Docker Engine.

## Features
___

| Feature                          | Summary                                                                                                                                                                                    |
|----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Authentication via JsonWebToken | Supports authentication using [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken).  |
| Code Linting                    | JavaScript code linting is done using [ESLint](http://eslint.org) - a pluggable linter tool for identifying and reporting on patterns in JavaScript.|
| Auto server restart             | Restart the server using [nodemon](https://github.com/remy/nodemon) in real-time anytime an edit is made, with babel compilation and eslint.|
| Express                         | [Express](https://www.npmjs.com/package/express) is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.|
| Error handling                  | Centralized error handling mechanism |
| Logging                         | Using [Winston](https://github.com/winstonjs/winston) and [Morgan](https://github.com/expressjs/morgan)|
| API documentation               | With [Swagger-ui-express](https://github.com/scottie1984/swagger-ui-express)|
| Authentication and authorization| Using [Passport-jwt](https://github.com/mikenicholson/passport-jwt) - A Passport strategy for authenticating with a JSON Web Token.|
| Validation                      | Request data validation using [Joi](https://github.com/hapijs/joi)|

## Getting Started
___

**Install dependencies**:
```sh
npm install
```

**Start server**:
```sh
npm run start
```

Or

`open package.json file and run dev-es6 script`


## .env file
```
File is placed at the base of the project directory and contains all necessary variables for application
like port number, database url and different credentials.
```

```
# Kindly replace below values with your credentials.

# Port Number for running server
PORT=3000

# MongoDB database url
MONGODB_URL=mongodb://127.0.0.1:27017/fosocial


# Password Authentication using JWT
# JWT Secret for creating and verifing access token
JWT_SECRET=QDw^d2+qu/!2?~Uf

# Access Token Expiration in minutes
JWT_ACCESS_EXPIRATION_MINUTES=30

# Refresh Token Expiration in days
JWT_REFRESH_EXPIRATION_DAYS=30


# SMTP configuration options for the email service
# the hostname or IP address and the port to connect to (defaults to ‘localhost’)
SMTP_HOST=email-server
SMTP_PORT=587

# the username and password for authentication object used in SMTP connection data
SMTP_USERNAME=email-server-username
SMTP_PASSWORD=email-server-password

# Email id from whom email is being sent
EMAIL_FROM=support@yourapp.com

# Base url for email verification url in verification email
FRONT_URL=frontend-url


# Redis connection options for creating redis client instance
# it will connect to localhost:6379 (hostName:port)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=root


# Authentication via Google
# Options specifying a app clinet ID and app client secret for google strategy
GOOGLE_CLIENT_ID=google_client_id
GOOGLE_CLIENT_SECRET=google_client_secret


# Authentication via FaceBook
# Options specifying a app clinet ID and app client secret for FaceBook strategy
FACEBOOK_CLIENT_ID=facebook_client_id
FACEBOOK_CLIENT_SECRET=facebook_client_secret


# Authentication via Apple
# Options specifying a app clinet ID that accesses the backend for Apple token strategy
APPLE_CLIENT_ID=apple_client_id
APPLE_TEAM_ID=apple_team_id
APPLE_KEY_ID=apple_key_id


# Authentication via GitHub
# Options specifying a client ID, client secret for GitHub strategy
GITHUB_CLIENT_ID=github_client_id
GITHUB_CLIENT_SECRET=github_team_id


# Stripe for Payment service
# Stripe account's secret key for stripe module configuration
STRIPE_KEY=stripe_key
STRIPE_GATEWAY_ID=stripe_gateway_id


# Captcha for verifing the human identity
# Captcha secret key for validating Captcha
CAPTCHA_SECRET_KEY=captcha_secret_key


# Logger Utility - log messages for the system
# Level of the message logging while createLogger using winston
LOG_LEVEL=log_level


# File-upload service Via AWS provider
# the Bucket name
AWS_BUCKET_NAME=aws_bucket_name

# accessKeyId and secretAccessKey that authorize your access to services.
AWS_ACCESS_KEY=aws_access_key
AWS_SECRET_ACCESS_KEY=aws_secret_access_key

# The Bucket Region in which you will request services.
AWS_BUCKET_REGION=bucket_region

```

## Project Structure
___

```
   ├── config            -  contains config files.
   ├── controllers       -  Controller files calls appropriate service functions.
   ├── docs              -  contains postman collection
   ├── middlewares       -  contains middleware files.
   ├── models            -  Model files contain schema for model.
   ├── routes            -  Route files contain all the routes
   ├── services          -  Service files contain execution logic for a single web route only.
   ├── utils             -  contains utils files.
   ├── validations       -  Joi validations schema files for each route api.
```

## Flow of code
___

- **Routes** : index.js file exports all model routes from all userRoles, imported into app.js to access all the routes.
```
    ├── routes
       ├── user
           ├── v1
              ├── auth
                 ├── auth.route.js   - contains CRUD operation for auth routes
             ├── user
                 ├── user.route.js   - contains CRUD operation for user model routes
           └── index.js               - exports all models routes
    └── index.js                     - exports all userRole routes
```


- **API Documentation** :

    - **Auth routes** :
        - `POST /v1/user/auth/send-verify-otp` - send the otp for verification
        - `POST /v1/user/auth/verify-otp` - verify the otp
        - `GET /v1/user/auth/me` - get Current logged in userInfo
        - `PUT /v1/user/auth/me` - update the Current UserInfo
        - `POST /v1/user/auth/forgot-password-based-on-token` - Token based Verification
        - `POST /v1/user/auth/verify-reset-code` - verify that code is for changePassword is Valid.
        - `POST /v1/user/auth/verify-reset-otp` - verify that OTP is for changePassword is Valid.
        - `POST /v1/user/auth/reset-password-based-on-token` - Reset the password Using the Token and Email provided by Use
        - `POST /v1/user/auth/logout` - logout
        - `POST /v1/user/auth/register` - register
        - `POST /v1/user/auth/login` - login
        - `POST /v1/user/auth/refresh-tokens` - refresh auth tokens
        - `POST /v1/user/auth/forgot-password` - send reset password email
        - `POST /v1/user/auth/reset-password` - reset password
        - `POST /v1/user/auth/send-verify-email` - send verify email
        - `POST /v1/user/auth/verify-email` - verify email

    - **User routes** :

        - `POST /v1/user/` - create a user
        - `GET /v1/user/user/` - get all users
        - `GET /v1/user/user/:userId` - get user by Id
        - `GET /v1/user/user/paginated` - get user paginated
        - `PUT /v1/user/user/:userId` - update user by Id
        - `DELETE /v1/user/user/:userId` - delete user by Id


- **Error Handling** :
    - The app has a centralized error handling mechanism.
    - Controllers should try to catch the errors and forward them to the error handling middleware (by calling `next(error)`). For convenience, you can also wrap the controller inside the catchAsync utility wrapper, which forwards the error.
    - When running in development mode, the error response also contains the error stack.
    - The app has a utility ApiError class to which you can attach a response code and a message, and then throw it from anywhere (catchAsync will catch it).
    - For example, if you are trying to get a user from the DB who is not found, and you want to send a 404 error, the code should look something like:

        ```
        import httpStatus from 'http-status';
        import ApiError from 'utils/ApiError';
        import User from 'models/user.model';

        export async function getUser(userId) {
            const user = await User.findById(userId);
            if (!user) {
                throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
            }
        };
        ```
        The error handling middleware sends an error response, which has the following format:

        ```
        {
            "code": 404,
            "message": "Not found"
        }
        ```

- **Validations**:
    - Joi validations schema files for each route api.
        ```
           ├── validations
              ├── user
                 ├── auth.validation.js   - contains all validation schema of auth route
                 ├── user.validation.js   - contains all validation schema of user model route
               └── index.js                - exports all validation schemas
        ```

    -  The validation schemas are defined in the `validations` directory and are used in the routes by providing them as parameters to the `validate` middleware.

        ```
        import express from 'express';
        import { userValidation } from 'validations/user';
        import { userController } from 'controllers/user';

        const router = express.Router();

        router
            .route('/')
            /**
            * createUser
            **/
        .post(validate(userValidation.createUser), userController.create)
        ```

- **Authentication** :
    - To require authentication for certain routes, you can use the `auth` middleware.
        ```
        import express from 'express';
        import auth from 'middlewares/auth';
        import { userValidation } from 'validations/user';
        import { userController } from 'controllers/user';

        const router = express.Router();

        router
            .route('/')
            /**
            * createUser
            **/
        .post(auth(), validate(userValidation.createUser), userController.create)
        ```

    - These routes require a valid JWT access token in the Authorization request header using the Bearer schema. If the request does not contain a valid access token, an Unauthorized (401) error is thrown.

        - **Generating Access Tokens** :

            - An access token can be generated by making a successful call to the register (`POST /v1/auth/register`) or login (`POST /v1/auth/login`) endpoints. The response of these endpoints also contains refresh tokens (explained below).

            - An access token is valid for 30 minutes. You can modify this expiration time by changing the `JWT_ACCESS_EXPIRATION_MINUTES` environment variable in the .env file.

        - **Refreshing Access Tokens:**

            - After the access token expires, a new access token can be generated, by making a call to the refresh token endpoint (`POST /v1/auth/refresh-tokens`) and sending along a valid refresh token in the request body. This call returns a new access token and a new refresh token.

            - A refresh token is valid for 30 days. You can modify this expiration time by changing the `JWT_REFRESH_EXPIRATION_DAYS` environment variable in the .env file.


- **Authorization** :
    - The `auth` middleware can also be used to require certain rights/permissions to access a route.

        ```
        import express from 'express';
        import auth from 'middlewares/auth';
        import { userController } from 'controllers/user';

        const router = express.Router();

        router.post('/users', auth('user'), userController.createUser);
        ```


- **Controllers**:
    - Controller files calls appropriate service functions.
        ```
          ├── controllers
             ├── user
                ├── auth.controller.js   - contains all controller functions of auth route
                ├── user.controller.js   - contains all controller function of user model route
              └── index.js                - exports all controller functions
        ```
- **Services**:
    - Service files contains execution logic for a single web route only.
        ```
          ├── services
             ├── auth.service.js      - contains all service functions of auth route
             ├── user.controller.js   - contains all service function of user model route
           └── index.js                - exports all service functions
        ```

- **Models**: Model files contains schema for model.


- **Logging** :
    - Import the logger from `config/logger.js`. It is using the Winston logging library.

    - Logging should be done according to the following severity levels (ascending order from most important to least important):

        ```
        const logger = require('config/logger');

        logger.error('message');
        logger.warn('message');
        logger.info('message');
        ```

    - In development mode, log messages of all severity levels will be printed to the console.

    - In production mode, only `info`, `warn`, and `error` logs will be printed to the console.
    - It is up to the server (or process manager) to actually read them from the console and store them in log files.
    - This app uses pm2 in production mode, which is already configured to store the logs in log files.

    - Note: API request information (request url, response code, timestamp, etc.) are also automatically logged (using morgan).


- **Custom Mongoose Plugins** :
    - The app also contains 2 custom mongoose plugins that you can attach to any mongoose model schema. You can find the plugins in `models/plugins`.
        ```
        import mongoose from 'mongoose';
        import mongoosePaginateV2 from 'mongoose-paginate-v2';

        const UserSchema = mongoose.Schema(
            {
                /* schema definition here */
            },
            { timestamps: true }
        );

        UserSchema.plugin(toJSON);
        UserSchema.plugin(mongoosePaginateV2);

        const UserModel = mongoose.models.User || mongoose.model('User', UserSchema, 'User');
        ```
    - **toJSON** :
        - The toJSON plugin applies the following changes in the toJSON transform call:
            - removes __v, createdAt, updatedAt, and any schema path that has private: true
            - replaces _id with id

    - **Paginate** :
        - The paginate plugin adds the `paginate` static method to the mongoose schema.
        - Adding this plugin to the `User` model schema will allow you to do the following:
            ```
            export async function getUserListWithPagination(filter, options = {}) {
                const user = await User.paginate(filter, options);
                return user;
            }
            ```

- **Linting** :
    - Linting is done using ESLint and Prettier.
    - In this app, ESLint is configured to follow the Airbnb JavaScript style guide with some modifications. It also extends eslint-config-prettier to turn off all rules that are unnecessary or might conflict with Prettier.
    - To modify the ESLint configuration, update the `.eslintrc.json` file. To modify the Prettier configuration, update the `.prettierrc.json` file.
    - To prevent a certain file or directory from being linted, add it to `.eslintignore` and `.prettierignore`.
