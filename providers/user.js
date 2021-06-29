import React, { createContext, useEffect, useContext, useState } from "react";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import messaging from "@react-native-firebase/messaging";
import database from "@react-native-firebase/database";
import { requestUserPermission, getFcmToken } from "../notifications";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

GoogleSignin.configure({
  webClientId:
    "1048000501046-9ubq5o872gsbsut6am9vcndrr6s6dv47.apps.googleusercontent.com",
});

const initialUser = {
  username: null,
  email: null,
};

const ROLE = {
  NORMAL: 1,
  ADMIN: 2,
};

const TITLE = {
  STUDENT: "Student",
  TEACHER: "Teacher",
};

const UserContext = createContext(initialUser);

const UserProvider = ({ SignedInScreen, SignedOutScreen }) => {
  const [user, setUser] = useState(null);
  const [intializing, setInitializing] = useState(true);

  const UserChange = async (u) => {
    const loggedUser = auth().currentUser;
    if (loggedUser) {
      try {
        setUser(loggedUser);
        if (intializing) setInitializing(false);

        let userSnapshot = await firestore()
          .collection("user")
          .doc(loggedUser.uid)
          .get();
        const userData = userSnapshot.data();

        // if (requestUserPermission()) {
        //   const token = await getFcmToken()
        //   userSnapshot.docs[0].ref.update({
        //     token
        //   })
        // }

        setUser({ ...user, ...userData });
        messaging().subscribeToTopic(`${userData.title}`);
        // Change online status
        // const onlineStatusRef = database().ref(`/status/${loggedUser.uid}`);

        // onlineStatusRef.set(true).then(() => console.log("ONLINE"));
        // onlineStatusRef
        //   .onDisconnect()
        //   .remove()
        //   .then(() => console.log("OFFLINE"));
      } catch (err) {
        console.log("ERRORR", err);
        setUser(null);
      }
    }
    if (!loggedUser) {
      setUser(null);
    }
    setInitializing(false);
  };

  useEffect(() => {
    const unsubscribeAuth = auth().onAuthStateChanged(UserChange);
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log("Message handled in the background!", remoteMessage);
      if (remoteMessage.data.logout) {
        auth().signOut();
      }
    });

    const unsubscribeOnMessage = messaging().onMessage(
      async (remoteMessage) => {
        console.log(
          "A new FCM message arrived!",
          JSON.stringify(remoteMessage)
        );
        if (remoteMessage.data.logout) {
          auth().signOut();
        }
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribeOnMessage();
    };
  }, []);

  if (intializing) return null;

  const register = async (username, email, password) => {
    if (!username || !email || !password) return;

    try {
      let res = await fetch(
        "https://academiacollege.azurewebsites.net/api/signUp",
        {
          method: "POST",
          body: JSON.stringify({
            username,
            email,
            password,
          }),
        }
      );
      res = await res.json();
      if (!res.error) {
        console.log("Account created succesfully.");
      } else {
        console.error(res.error.message);
      }
    } catch (error) {
      console.error("ERR", error);
      return error;
    }
  };

  const login = async (email, password) => {
    return auth().signInWithEmailAndPassword(email, password);
  };

  const logout = async () => {
    messaging().deleteToken();
    await firestore().collection("user").doc(user.id).update({
      token: null,
    });
    auth().signOut();
  };

  const linkWithGoogle = async () => {
    // console.log("SAD")
    // var googleProvider =  new auth.GoogleAuthProvider();
    // auth().currentUser.linkWithPopup(googleProvider).then((result) => {
    //   // Accounts successfully linked.
    //   var credential = result.credential;
    //   var user = result.user;
    //   console.log("CREDENTIAL", credential)
    //   console.log("USER", result.user)
    //   // ...
    // }).catch((error) => {
    //   // Handle Errors here.
    //   // ...
    // });
    const { idToken } = await GoogleSignin.signIn();
    let credential = auth.GoogleAuthProvider.credential(idToken);

    auth().currentUser.linkWithCredential(credential);
    console.log(idToken);
  };
  const loginWithGoogle = async () => {
    // var googleProvider =  auth.GoogleAuthProvider();
    // auth().signInWithCredential()
  };

  return (
    <UserContext.Provider
      value={{
        user,
        register,
        login,
        logout,
        setUser: setUser,
        linkWithGoogle,
        loginWithGoogle,
      }}
    >
      {user ? <SignedInScreen /> : <SignedOutScreen />}
    </UserContext.Provider>
  );
};

const useUserContext = () => useContext(UserContext);

export { UserProvider, UserContext, useUserContext };
