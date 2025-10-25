db = db.getSiblingDB('admin');
db.createUser({
  user: 'Supervisor',
  pwd: 'Supervisor',
  roles: [{ role: 'root', db: 'admin' }]
});

db = db.getSiblingDB('mysite');
db.createCollection('mysite');
db.mysite.insertOne({ hello: "world" })
db.mysite.insertOne({ message: "This is a test document" });
db.mysite.insertOne({ status: "initialized" });
db.mysite.insertOne({ version: "1.0.0" });
db.mysite.insertOne({ timestamp: new Date() });
