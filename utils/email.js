const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");

module.exports = class Email {
  constructor(user,url){
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Udit Jain <${process.env.EMAIL_FROM}>`

  }
  newTransport(){
    if(process.env.NODE_ENV === "production") {
      // sendgrid
      return 1;
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // send the email
  async send(template,subject){
    // Render HTML based on a pug template

    //    we use this bcz we can't use res.render bcz we don't need to render the html from the template  
    //     but instead generate html from the template and store it into "html" options of "mailoptions"
    const html =  pug.renderFile(`${__dirname}/../views/emails/${template}.pug`,{
      firstName : this.firstName,
      url:this.url,
      subject:subject
    });

    // Define eamil options
    const mailOptions = {
      from : this.from,
      to : this.to,                         // options is the object that we will pass in this func. as argument
      subject : subject,
      html : html,
      text : htmlToText.fromString(html)           //converts html into text      (to also send a text version of email)
  }

    // Create a transport and send email
    
    await this.newTransport().sendMail(mailOptions)
  }

  async sendWelcome(){
    await this.send("welcome", "Welcome to the Natours Family!")
  }

  async sendPasswordReset(){
    await this.send("passwordReset","Your password reset token (valid for only 10 minutes)")
  }
}


// ========================================= MAILTRAP =========================================================
/*
const sendEmail = async options=>{
    // 1) Create a transporter

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        }
      });

    // 2) Define the email options

    const mailOptions = {
        from : "Udit Jain <hellouj@gmail.com>",
        to : options.email,                         // options is the object that we will pass in this func. as argument
        subject : options.subject,
        text : options.message
    }

    // 3) Actually send the email
    await transporter.sendMail(mailOptions);
}

*/







/////////////  ========================   GMAIL       ========================================================

// const sendEmail = options =>{
//     // 1) Create a transporter
//     const transporter = nodemailer.createTransport({
//         service : "Gmail",
//         auth: {
//             user : process.env.EMAIL_USERNAME,
//             pass: process.env.EMAIL_PASSWORD
//         }
//         // 2)ACTIVATE IN GMAIL "LESS SECURE APP" OPTIONS
//     })
//     // 2) Define the email options

//     // 3) Actually send the email
// }
// =============================================================================================================