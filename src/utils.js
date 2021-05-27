function generatePassword() {
  let password = "";
  const alphabet =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  for (let i = 0; i < 8; i++) {
    const j = Math.floor(Math.random() * alphabet.length + 0);
    password += alphabet[j];
  }

  return password;
}

module.exports = {
  generatePassword,
};
