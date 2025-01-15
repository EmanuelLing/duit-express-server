const express = require('express');
const adminRouter = express.Router();
const db = require('./../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 
const crypto = require('crypto');

const jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
process.env.JWT_SECRET = jwtSecret;

// response
const createResponse = (data = {}, errorCode = 0, message = "") => {
    return { data, errorCode, message };
};

// login -> request email & password, response admin data & token
// can use email:alice.smith@example.com password:123 to login
adminRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await db.query("SELECT * FROM admin WHERE email = $1", [email]);
        const admin = result.rows[0];

        console.log("Request Body:", req.body); //

        if (!admin) {
            return res.status(404).json(createResponse(null, -1, 'Admin not found'));
        }

        console.log("Input Password:", password); //
        console.log("Stored Password:", admin.password); //

        const isPasswordMatch = await bcrypt.compare(password, admin.password);
        if (!isPasswordMatch) {
            return res.status(400).json(createResponse(null, -1, 'Invalid password'));
        }

        const token = jwt.sign({ adminid: admin.adminid }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const adminData = {
            adminid: admin.adminid,
            password: admin.password,
            name: admin.name,
            email: admin.email,
            phonenumber: admin.phonenumber,
        };

        res.json(createResponse({ adminData, token },0,'Login successfully.'));
    } catch (error) {
        console.error(error.message);
        res.status(500).json(createResponse(null, -1001, 'Server Error'));
    }
});

// register -> request admin data, response success message
adminRouter.post('/register', async (req, res) => {
    try {
        const { username, password, name, email, phonenumber } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO admin (username, password, name, email, phonenumber)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING adminid
        `;

        const result = await db.query(query, [username, hashedPassword, name, email, phonenumber]);
        const adminid = result.rows[0].adminid;

        res.status(201).json(createResponse({ adminid }, 0, 'Admin added successfully'));
    } catch (error) {
        console.error(error.message);
        res.status(500).json(createResponse(null, -1001, 'Server Error'));
    }
});

// delete -> request admin id, response success message
adminRouter.delete('/:adminid', async (req, res) => {
    try {
        const { adminid } = req.params;
        const query = 'DELETE FROM admin WHERE adminid = $1';

        const result = await db.query(query, [adminid]);

        if (result.rowCount > 0) {
            res.status(200).json(createResponse(null, 0, 'Admin successfully deleted'));
        } else {
            res.status(404).json(createResponse(null, -1, 'Admin not found'));
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json(createResponse(null, -1001, 'Server Error'));
    }
});

// get all admin -> response admin list
adminRouter.get('/', async (req, res) => {
    try {
        const query = 'SELECT * FROM admin';
        const result = await db.query(query);

        if (result.rows.length === 0) {
            return res.status(404).json(createResponse([], 0, 'No admins found'));
        }

        res.status(200).json(createResponse(result.rows, 0, 'Admins retrieved successfully'));
    } catch (error) {
        console.error(error.message);
        res.status(500).json(createResponse(null, -1001, 'Server Error'));
    }
});

// update (edit) -> request admin id and updated data, response success message
adminRouter.put('/:adminid', async (req, res) => {
    try {

        const { adminid } = req.params; 
        const { password, name, email, phonenumber } = req.body; 
        
        console.log("Request received at /admin/:adminid");
        console.log("Request body:", req.body);
        console.log("Admin ID:", req.params.adminid);

        console.log("Authorization Header:", req.headers.authorization);

        // check admin if exists
        const adminResult = await db.query('SELECT * FROM admin WHERE adminid = $1', [adminid]);
        if (adminResult.rows.length === 0) {
            return res.status(404).json(createResponse(null, -1, 'Admin not found'));
        }

        const fieldsToUpdate = [];
        const values = [];
        let query = 'UPDATE admin SET ';

        /*

        if (username) {
            fieldsToUpdate.push('username = $' + (fieldsToUpdate.length + 1));
            values.push(username);
        }*/
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            fieldsToUpdate.push('password = $' + (fieldsToUpdate.length + 1));
            values.push(hashedPassword);
        }
        if (name) {
            fieldsToUpdate.push('name = $' + (fieldsToUpdate.length + 1));
            values.push(name);
        }
        if (email) {
            fieldsToUpdate.push('email = $' + (fieldsToUpdate.length + 1));
            values.push(email);
        }
        if (phonenumber) {
            fieldsToUpdate.push('phonenumber = $' + (fieldsToUpdate.length + 1));
            values.push(phonenumber);
        }

        if (fieldsToUpdate.length === 0) {
            return res.status(400).json(createResponse(null, -1, 'No fields to update'));
        }

        query += fieldsToUpdate.join(', ') + ' WHERE adminid = $' + (fieldsToUpdate.length + 1);
        values.push(adminid);

        // update
        const result = await db.query(query, values);

        console.log("Request received at /admin/:adminid");
        console.log("Request body:", req.body);
        console.log("Admin ID:", req.params.adminid);
        console.log("Authorization Header:", req.headers.authorization);


        if (result.rowCount > 0) {
            //check updated data
            const updatedAdmin = await db.query('SELECT * FROM admin WHERE adminid = $1', [adminid]);
            res.status(200).json(createResponse(updatedAdmin.rows[0], 0, 'Admin successfully updated'));
        } else {
            res.status(404).json(createResponse(null, -1, 'Admin not found'));
        }
        
    } catch (error) {
        console.error(error.message);
        res.status(500).json(createResponse(null, -1001, 'Server Error'));
    }
});

// update password (edit) -> request admin id and password, response success message
adminRouter.put('/password/:adminid', async (req, res) => {
    try {
        const { adminid } = req.params;
        const { currentPassword, newPassword } = req.body;

        const result = await db.query("SELECT password FROM admin WHERE adminid = $1", [adminid]);
        const storedEncryptedPassword = result.rows[0]?.password;

        if (!storedEncryptedPassword) {
            return res.status(404).json(createResponse(null, -1, 'Admin not found'));
        }

        const isPasswordMatch = await bcrypt.compare(currentPassword, storedEncryptedPassword);

        if (!isPasswordMatch) {
            return res.status(400).json(createResponse(null, -1, 'Current password is incorrect'));
        }

        const newEncryptedPassword = await bcrypt.hash(newPassword, 10); 
        const result2 = await db.query("UPDATE admin SET password = $1 WHERE adminid = $2", [newEncryptedPassword, adminid]);

        if (result2.rowCount > 0) {
            //check updated data
            const updatedAdmin = await db.query('SELECT * FROM admin WHERE adminid = $1', [adminid]);
            res.status(200).json(createResponse(updatedAdmin.rows[0], 0, 'Password successfully updated'));
        } else {
            res.status(404).json(createResponse(null, -1, 'Admin not found'));
        }

        //res.json(createResponse(null, 0, 'Password updated successfully.'));
    } catch (error) {
        console.error(error.message);
        res.status(500).json(createResponse(null, -1001, 'Server Error'));
    }
});


module.exports = adminRouter;
