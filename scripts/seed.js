const admin = require("firebase-admin");

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://demo-urai-studio.firebaseio.com"
});

const db = admin.firestore();

async function seed() {
  console.log("Seeding database...");

  // Create a user
  const userRef = db.collection("studioUsers").doc("test-user");
  await userRef.set({ email: "test@example.com", roles: ["user"] });

  // Create a project
  const projectRef = db.collection("studioProjects").doc("test-project");
  await projectRef.set({ name: "Test Project", ownerId: "test-user" });

  console.log("Database seeded!");
}

seed();
