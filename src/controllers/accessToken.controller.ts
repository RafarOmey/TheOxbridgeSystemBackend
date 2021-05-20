import jsonwebtoken from 'jsonwebtoken';
import jwtDecode from 'jwt-decode';

const expiresIn:string = '2h';

class AccessToken{
   static generateToken(role:string):any{
      const t = jsonwebtoken.sign({'role':role}, process.env.TOKEN_SECRET, { expiresIn });
      return t;
   }

   static userRole(token:any):string{
      const decodedToken:any = jwtDecode(token);
      // console.log(decodedToken.role);
      return decodedToken.role;
   }
}
export {AccessToken}