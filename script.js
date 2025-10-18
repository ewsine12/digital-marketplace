
// script.js

let token = '';
let currentUser = null;

// ------------------ Auth ------------------
async function signup(){
    const name = prompt("Enter your name:");
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const res = await fetch('/api/auth/signup',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name,username,email,password})
    });
    const data = await res.json();
    alert(data.msg || data.error);
}

async function login(){
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const res = await fetch('/api/auth/login',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({username,email,password})
    });
    const data = await res.json();
    if(data.ok){
        token = data.token;
        currentUser = data.user;
        if(currentUser.role==='admin') showAdminDashboard();
        else showUserDashboard();
    }else{
        alert(data.error);
    }
}

// ------------------ User ------------------
async function showUserDashboard(){
    document.getElementById('auth').style.display='none';
    document.getElementById('user-dashboard').style.display='block';
    document.getElementById('user-name').innerText = currentUser.name;
    document.getElementById('user-balance').innerText = currentUser.balance;

    const res = await fetch('/api/products');
    const products = await res.json();
    const container = document.getElementById('products');
    container.innerHTML='';
    products.forEach(p=>{
        const div = document.createElement('div');
        div.className='product-card';
        div.innerHTML = `<h4>${p.title}</h4>
                         <p>${p.description}</p>
                         <p>Price: $${p.price}</p>
                         <button onclick="buyProduct('${p._id}')">Buy Now</button>`;
        container.appendChild(div);
    });
}

async function buyProduct(productId){
    const res = await fetch(`/api/buy/${productId}`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({userId:currentUser.id})
    });
    const data = await res.json();
    alert(data.msg);
}

// ------------------ Admin ------------------
function showAdminDashboard(){
    document.getElementById('auth').style.display='none';
    document.getElementById('admin-dashboard').style.display='block';
}

async function loadUsers(){
    const res = await fetch('/api/admin/users');
    const users = await res.json();
    const container = document.getElementById('admin-content');
    container.innerHTML='';
    users.forEach(u=>{
        const div = document.createElement('div');
        div.className='user-card';
        div.innerHTML = `<h4>${u.name}</h4><p>${u.username}</p><p>${u.email}</p>`;
        container.appendChild(div);
    });
}

async function loadOrders(){
    const res = await fetch('/api/admin/orders');
    const orders = await res.json();
    const container = document.getElementById('admin-content');
    container.innerHTML='';
    orders.forEach(o=>{
        const div = document.createElement('div');
        div.className='order-card';
        div.innerHTML = `<p>Product: ${o.productId.title}</p>
                         <p>User: ${o.userId.username}</p>
                         <p>Status: ${o.status}</p>
                         <button onclick="confirmPayment('${o._id}')">Confirm Payment</button>`;
        container.appendChild(div);
    });
}

function addProductForm(){
    const container = document.getElementById('admin-content');
    container.innerHTML=`<h3>Add Product</h3>
        <input id="prod-title" placeholder="Title">
        <input id="prod-desc" placeholder="Description">
        <input id="prod-price" placeholder="Price">
        <select id="prod-type">
            <option value="ip">IP</option>
            <option value="telegram">Telegram</option>
            <option value="star">Star Telegram</option>
        </select>
        <input id="prod-stock" placeholder="Stock">
        <button onclick="addProduct()">Add</button>
    `;
}

async function addProduct(){
    const title=document.getElementById('prod-title').value;
    const description=document.getElementById('prod-desc').value;
    const price=document.getElementById('prod-price').value;
    const type=document.getElementById('prod-type').value;
    const stock=document.getElementById('prod-stock').value;

    const res = await fetch('/api/admin/product',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({title,description,price,type,stock})
    });
    const data = await res.json();
    alert(data.msg);
}
