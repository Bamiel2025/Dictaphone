// Simple user model for demonstration purposes
// In a real application, this would be connected to a database

class User {
  constructor(id, username, email, password) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password; // In a real app, this would be hashed
  }
  
  // Validate user credentials
  static validateCredentials(email, password) {
    // In a real application, we would check against a database
    // For demo purposes, we'll use a mock user
    const mockUser = {
      id: 1,
      username: 'demouser',
      email: 'demo@example.com',
      password: 'demo123'
    };
    
    if (email === mockUser.email && password === mockUser.password) {
      // Return user object without password
      const { password, ...userWithoutPassword } = mockUser;
      return userWithoutPassword;
    }
    
    return null;
  }
  
  // Find user by ID
  static findById(id) {
    // In a real application, we would query a database
    if (id === 1) {
      return {
        id: 1,
        username: 'demouser',
        email: 'demo@example.com'
      };
    }
    
    return null;
  }
  
  // Find user by email
  static findByEmail(email) {
    // In a real application, we would query a database
    if (email === 'demo@example.com') {
      return {
        id: 1,
        username: 'demouser',
        email: 'demo@example.com',
        password: 'demo123' // In a real app, this would be hashed
      };
    }
    
    return null;
  }
}

module.exports = User;