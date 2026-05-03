
import userRouter from './user.router.js';

function initRoutes(app){
    app.use('/user',userRouter);
}
 
export { initRoutes};
