
// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// MongoDB Connect
mongoose.connect(process.env.MONGO_URI)
    .then(()=>console.log('MongoDB Connected'))
    .catch(err=>console.log(err));

// Schemas
const userSchema = new mongoose.Schema({
    name: String,
    username: {type:String, unique:true},
    email: {type:String, unique:true},
    passwordHash: String,
    balance: {type:Number, default:0},
    role: {type:String, default:'user'}
},{timestamps:true});
const User = mongoose.model('User', userSchema);

const categorySchema = new mongoose.Schema({name:String});
const Category = mongoose.model('Category', categorySchema);

const productSchema = new mongoose.Schema({
    title:String,
    categoryId:{type:mongoose.Schema.Types.ObjectId, ref:'Category'},
    price:Number,
    description:String,
    type:{type:String, enum:['ip','telegram','star'], default:'telegram'},
    stock:{type:Number, default:0}
});
const Product = mongoose.model('Product', productSchema);

const ipPoolSchema = new mongoose.Schema({ip:String, assignedTo:{type:mongoose.Schema.Types.ObjectId, default:null}});
const IPPool = mongoose.model('IPPool', ipPoolSchema);

const orderSchema = new mongoose.Schema({
    userId:{type:mongoose.Schema.Types.ObjectId, ref:'User'},
    productId:{type:mongoose.Schema.Types.ObjectId, ref:'Product'},
    price:Number,
    status:{type:String, enum:['pending','approved','completed','cancelled'], default:'pending'},
    meta:Object
},{timestamps:true});
const Order = mongoose.model('Order', orderSchema);

// ------------------ Auth Routes -------------------

// SignUp
app.post('/api/auth/signup', async (req,res)=>{
    const {name,username,email,password} = req.body;
    if(!username || !email || !password) return res.status(400).json({error:'Missing fields'});
    const hash = await bcrypt.hash(password,10);
    const user = new User({name,username,email,passwordHash:hash});
    await user.save();
    res.json({ok:true, msg:'User registered'});
});

// Login
app.post('/api/auth/login', async (req,res)=>{
    const {username,email,password} = req.body;
    const user = await User.findOne({$or:[{username},{email}]});
    if(!user) return res.status(400).json({error:'User not found'});
    const valid = await bcrypt.compare(password,user.passwordHash);
    if(!valid) return res.status(400).json({error:'Wrong password'});
    const token = jwt.sign({id:user._id, role:user.role}, JWT_SECRET,{expiresIn:'7d'});
    res.json({ok:true, token, user:{name:user.name, role:user.role, balance:user.balance}});
});

// ------------------ Product Routes -------------------

// Get Products
app.get('/api/products', async (req,res)=>{
    const products = await Product.find();
    res.json(products);
});

// Buy Product (Manual Payment)
app.post('/api/buy/:productId', async (req,res)=>{
    const {userId} = req.body;
    const product = await Product.findById(req.params.productId);
    if(!product) return res.status(404).json({error:'Product not found'});
    const order = new Order({userId, productId:product._id, price:product.price, status:'pending'});
    await order.save();
    res.json({ok:true, msg:'Order placed. Please complete payment manually.', order});
});

// Confirm Payment (Manual)
app.post('/api/order/confirm/:orderId', async (req,res)=>{
    const order = await Order.findById(req.params.orderId);
    if(!order) return res.status(404).json({error:'Order not found'});
    order.status = 'completed';
    await order.save();
    res.json({ok:true, msg:'Payment confirmed. Order completed.', order});
});

// ------------------ Admin Routes -------------------

// Add Product
app.post('/api/admin/product', async (req,res)=>{
    const {title,categoryId,price,description,type,stock} = req.body;
    const product = new Product({title,categoryId,price,description,type,stock});
    await product.save();
    res.json({ok:true, msg:'Product added', product});
});

// List Users
app.get('/api/admin/users', async (req,res)=>{
    const users = await User.find();
    res.json(users);
});

// List Orders
app.get('/api/admin/orders', async (req,res)=>{
    const orders = await Order.find().populate('productId').populate('userId');
    res.json(orders);
});

// IP Pool Assign
app.post('/api/admin/assign-ip', async (req,res)=>{
    const {userId} = req.body;
    const ip = await IPPool.findOne({assignedTo:null});
    if(!ip) return res.status(400).json({error:'No IP available'});
    ip.assignedTo = userId;
    await ip.save();
    res.json({ok:true, ip});
});

// ------------------ Start Server -------------------
app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
