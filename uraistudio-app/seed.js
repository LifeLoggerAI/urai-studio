const admin = require('firebase-admin');

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'http://127.0.0.1:8080',
});

const db = admin.firestore();

async function seed() {
  // Create a user
  const user = await admin.auth().createUser({
    uid: 'test-user',
    email: 'test@example.com',
    password: 'password',
  });

  // Create a project
  const projectRef = await db.collection('studioProjects').add({
    name: 'Test Project',
    ownerUid: user.uid,
  });

  // Create a recipe
  await db.collection('studioRecipes').add({
    name: 'Test Recipe',
    steps: ['transcode', 'caption'],
  });

  console.log('Database seeded successfully!');
}

seed();
