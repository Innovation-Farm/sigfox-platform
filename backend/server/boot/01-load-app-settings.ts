/**
 * This bootscript loads the overall app settings
 * @param app
 */
module.exports = (app: any, cb: any) => {
  // This is an important env
  if (process.env.BASE_URL) {
    if (!process.env.API_URL) {
      process.env.API_URL = 'https://api.' + process.env.BASE_URL.replace(/(^\w+:|^)\/\//, '');
    }
    console.log('API_URL: ' + process.env.API_URL);
  } else {
    console.error('Please set the BASE_URL env');
  }

  const AppSetting = app.models.AppSetting;
  let countAppSettings = 0;

  AppSetting.count((err: any, result: any) => {
    countAppSettings = result;
    if (countAppSettings == 0) {
      const appSettings = [
        {key: 'canUserRegister', value: true, type: 'boolean'},
        {key: 'canUserCreateOrganization', value: true, type: 'boolean'},
        {key: 'showDeviceSuccessRate', value: false, type: 'boolean'},
        {key: 'bannerMessage', value: 'Please keep in mind this platform is under active development.', type: 'string'},
        {key: 'isMongodbIndexed', value: false, type: 'boolean'}
      ];
      AppSetting.create(appSettings, (err: any, appSetting: any) => {
        if (err) console.error(err);
        cb();
      });
    } else {
      cb();
    }
  });

  // init with an admin role
  const adminRole = {
    name: "admin"
  };
  // Create admin
  app.models.Role.findOrCreate(
    {where: adminRole}, // Find
    adminRole, // Create
    (err: any, instance: any, created: boolean) => { // Callback
      if (err) console.error("Error creating admin role", err);
    });
};
