import jsonwebtoken from 'jsonwebtoken';
import jwtDecode from 'jwt-decode';

const expiresIn:string = '2h';

class AccessToken{
   // Generates a token
   static generateToken(role:string):any{
      const t = jsonwebtoken.sign({'role':role}, process.env.TOKEN_SECRET, { expiresIn });
      return t;
   }

   // gets the user's role. mostly used for authorization
   static userRole(token:any):string{
      const decodedToken:any = jwtDecode(token);
      // console.log(decodedToken.role);
      return decodedToken.role;
   }

   // gets the entire user from the decoded token
   static getUser(token:any):string{
      const decodedToken:any = jwtDecode(token);
      // console.log(decodedToken.role);
      return decodedToken;
   }
}
export {AccessToken}