import {Model} from "@mean-expert/model";
import * as path from "path";
import {generateVerificationToken} from "./utils";

const loopback = require("loopback");

const sendMail = (to: string, subject: string, html_body: string, user: any) => {
  const options = {
    type: "email",
    to: to,
    from: process.env.MAIL_FROM,
    subject: subject,
    html: html_body,
    redirect: "",
    user: user,
  };

  // use mailgun
  if (process.env.MAILGUN_API_KEY && 
      process.env.MAILGUN_DOMAIN && 
      process.env.MAILGUN_REGION) {

    const mailgun = require("mailgun-js")({
      host: "api." + process.env.MAILGUN_REGION + ".mailgun.net",
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN
    });
    mailgun.messages().send(options, (error: any, body: any) => {
      if (error) {
        console.error(error);
      } else {
        console.log("send mail with mailgun:", body);
      }
    });
  } else {
    // use sendmail
    const sendmail = require('sendmail')();
    const options = {
      type: "email",
      to: to,
      from: process.env.MAIL_FROM,
      subject: subject,
      html: html_body,
      redirect: "",
      debug: true,
    };
    sendmail(options);
    console.log("send mail with sendmail:", options);
  }
}

/**
 * @module user
 * @description
 * Write a useful user Model description.
 * Register hooks and remote methods within the
 * Model Decorator
 **/

@Model({
  hooks: {
    beforeSave: {name: "before save", type: "operation"},
    afterRemoteLogin: {name: "login", type: "afterRemote"},
    afterRemoteCreate: {name: "create", type: "afterRemote"},
    afterRemoteChangePassword: {name: "changePassword", type: "afterRemote"},
    beforeRemoteDelete: {name: "deleteById", type: "beforeRemote"},
    afterRemoteDelete: {name: "deleteById", type: "afterRemote"}
  },
  remotes: {
    loginQr: {
      accepts: [
        {arg: "redirect", type: "string", required: true},
        {arg: "res", type: "object", http: {source: "res"}}
      ],
      returns: {arg: "result", type: "array"},
      http: {path: "/login/qr", verb: "get"}
    }
  },
})


class user {

  // LoopBack model instance is injected in constructor
  constructor(public model: any) {
    //send password reset link when password reset requested
    model.on('resetPasswordRequest', function (info: any) {
      const baseUrl = process.env.BASE_URL;
      const resetUrl = baseUrl + '/#/reset-password?access_token=' + info.accessToken.id;
      // Prepare a loopback template renderer
 
      let renderer: Function;
      try {
        renderer = loopback.template(path.resolve(__dirname, "../../server/views/" + process.env.MAIL_LANG + "/resetPassword.ejs"));
      } catch {
        renderer = loopback.template(path.resolve(__dirname, "../../server/views/en/resetPassword.ejs"));
      }
      const html_body = renderer({resetUrl});
      sendMail(info.email, "Reset yout password on sigfox platform", html_body, null);
    });
  }

  public loginQr(redirect: string, res: any, next: Function) {
    console.log(redirect);
    res.location(redirect);
    res.status(302);
    next();
  }

  public afterRemoteChangePassword(ctx: any, reuslt: any, next: Function): void {
    const userId = ctx.args.id;
    this.model.findById(
      userId,
      {},
      (err: any, userInstance: any) => {
        if (err) {
          console.error(err);
          next(err, userInstance);
        } else {
          // Found user
          const devAccessTokens = userInstance.devAccessTokens;
          if (devAccessTokens) {
            this.model.app.models.AccessToken.create(devAccessTokens, (error: any, result: any) => {
              if (err) next(error, result);
              else next();
              console.log("Successfully restored devAccessTokens in AccessToken model.");
            });
          } else next();
        }
      });
  }

  public beforeSave(ctx: any, next: Function): void {
    if (ctx.instance) {
      ctx.instance.createdAt = new Date();
      ctx.instance.email = ctx.instance.email.toLocaleLowerCase();
    }
    console.log("user: Before Save");
    next();
  }

  public afterRemoteLogin(ctx: any, loggedUser: any, next: any) {
    // Update the last login date
    this.model.findById(loggedUser.userId, (err: any, user: any) => {
      if (err) console.error(err);
      else user.updateAttribute('loggedAt', new Date(), (err: any, user: any) => {
      });
    });
    next();
  }

  public afterRemoteCreate(ctx: any, userInstance: any, next: any) {

    console.log('user afterRemoteCreate');

    const userRole = {
      name: "user"
    };

    // Check if any user exists
    this.model.count(
      (err: any, countUser: any) => {
        if (err) console.error(err);
        else {
          if (countUser === 1) {
            // Create admin user
            this.model.app.models.Role.findOne(
              {where: {name: "admin"}}, // Find
              (err: any, instance: any) => { // Callback
                if (err) console.error("Error creating role", err);
                else {
                  instance.principals.create({
                    principalType: this.model.app.models.RoleMapping.USER,
                    principalId: userInstance.id,
                  }, (err: any, principalInstance: any) => {
                    if (err) console.log(err);
                    else {
                      console.log(principalInstance);
                      next();
                    }
                  });
                }
              });
          } else {
            // Create normal user
            this.model.app.models.Role.findOrCreate(
              {where: {name: "user"}}, // Find
              userRole, // Create
              (err: any, instance: any, created: boolean) => { // Callback
                if (err) console.error("Error creating role", err);
                else if (created) {
                  console.log("Created role", instance);
                  instance.principals.create({
                    principalType: this.model.app.models.RoleMapping.USER,
                    principalId: userInstance.id,
                  }, (err: any, principalInstance: any) => {
                    if (err) console.error(err);
                    else {
                      console.log(principalInstance);
                      next();
                    }
                  });
                } else {
                  instance.principals.create({
                    principalType: this.model.app.models.RoleMapping.USER,
                    principalId: userInstance.id,
                  }, (err: any, principalInstance: any) => {
                    if (err) console.log(err);
                    else {
                      console.log(principalInstance);
                      next();
                    }
                  });
                }
              });
          }
        }
      });

    // Send mail
    const verificationToken = generateVerificationToken();
    userInstance.updateAttributes({verificationToken});

    // Create a custom object your want to pass to the email template. You can create as many key-value pairs as you want
    const verificationUrl = process.env.API_URL + "/api/users/confirm?uid=" + userInstance.id + "&token=" + verificationToken + "&redirect=" + process.env.BASE_URL;
    const customMessage = {verificationUrl};

    let renderer: Function;
    try {
      renderer = loopback.template(path.resolve(__dirname, "../../server/views/" + process.env.MAIL_LANG + "/verify.ejs"));
    } catch {
      renderer = loopback.template(path.resolve(__dirname, "../../server/views/en/verify.ejs"));
    }

    const html_body = renderer(customMessage);
    sendMail(userInstance.email, "Welcome to the Sigfox Platform!", html_body, userInstance);
  }

  // Before delete user method
  public beforeRemoteDelete(ctx: any, result: any, next: Function): void {
    // Models
    const User = this.model.app.models.User;

    const userId = ctx.args.id;

    User.findOne({where: {id: userId}, include: "Organizations"}, (err: any, user: any) => {
      if (!err && user && user.Organizations) {
        user.toJSON().Organizations.forEach((orga: any) => {
          user.Organizations.remove(orga.id, (err: any, result: any) => {
            if (!err) {
              console.log("Unlinked user from organization (" + orga.name + ")");
            }
          });
        });
      }
    });
    next();
  }

  // After delete user method
  public afterRemoteDelete(ctx: any, result: any, next: Function): void {
    // Models
    const RoleMapping = this.model.app.models.RoleMapping;
    const Category = this.model.app.models.Category;
    const Device = this.model.app.models.Device;
    const Message = this.model.app.models.Message;
    const Alert = this.model.app.models.Alert;
    const AlertHistory = this.model.app.models.AlertHistory;
    const Geoloc = this.model.app.models.Geoloc;
    const Connector = this.model.app.models.Connector;
    const AccessToken = this.model.app.models.AccessToken;

    // Obtain the userId with the access token of ctx

    // console.log(ctx.args.id);
    // console.log(result);

    const userId = ctx.args.id;

    RoleMapping.destroyAll({principalId: userId}, (error: any, result: any) => {
    });
    Category.destroyAll({userId: userId}, (error: any, result: any) => {
    });
    Device.destroyAll({userId: userId}, (error: any, result: any) => {
    });
    Message.destroyAll({userId: userId}, (error: any, result: any) => {
    });
    Alert.destroyAll({userId: userId}, (error: any, result: any) => {
    });
    AlertHistory.destroyAll({userId: userId}, (error: any, result: any) => {
    });
    Geoloc.destroyAll({userId: userId}, (error: any, result: any) => {
    });
    Connector.destroyAll({userId: userId}, (error: any, result: any) => {
    });
    AccessToken.destroyAll({userId: userId}, (error: any, result: any) => {
    });
    // this.model.app.models.Dashboard.destroyAll({userId: userId}, (error: any, result: any) => { });
    // this.model.app.models.Widget.destroyAll({userId: userId}, (error: any, result: any) => { });

    next(null, "Success");
  }
}

module.exports = user;
