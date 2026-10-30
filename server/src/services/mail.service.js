// Development stand-in: prints the reset link to the server console.
// For production, replace the body with nodemailer (or any email API) and send `link` to `to`.
export async function sendResetEmail(to, link) {
  console.log(`\n[password reset] ${to}\n${link}\n`);
}
