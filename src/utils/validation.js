
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // export const validatePassword = (password) => {
  //   const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;
  //   return passwordRegex.test(password);
  // };
  export const validatePassword = (password) => {
    return password.length >= 6;
  };

  export const validateUsername = (username) => {
    const usernameRegex = /^[A-Za-z]+$/;
    return usernameRegex.test(username);
  };
  