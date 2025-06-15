import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";
import Facebook from "@auth/core/providers/facebook";
import Resend from "@auth/core/providers/resend";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
        };
      },
    }),
    Google({
      profile(profile) {
        return {
          email: profile.email,
          name: profile.name,
          image: profile.picture,
        };
      },
    }),
    Facebook({
      profile(profile) {
        return {
          email: profile.email,
          name: profile.name,
          image: profile.picture,
        };
      },
    }),
    Resend({
      from: "noreply@tiketmasuk.com", // You can customize this
    }),
  ],
}); 