import React, { Component } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Platform,
    StatusBar,
    Image
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { RFValue } from "react-native-responsive-fontsize";

import * as Google from "expo-google-app-auth";
import firebase from "firebase";

export default class LoginScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        this.fetchUser();
    }

    async fetchUser() {
        let theme, name, image;
        await firebase
            .database()
            .ref("/users/" + firebase.auth().currentUser.uid)
            .on("value", function (snapshot) {
                theme = snapshot.val().current_theme;
                name = `${snapshot.val().first_name} ${snapshot.val().last_name}`;
                image = snapshot.val().profile_picture;
            });
        this.setState({
            light_theme: theme === "light" ? true : false,
            isEnabled: theme === "light" ? false : true,
            name: name,
            profile_image: image
        });
    }

    isUserEqual = (googleUser, firebaseUser) => {
        if (firebaseUser) {
            var providerData = firebaseUser.providerData;
            for (var i = 0; i < providerData.length; i++) {
                if (
                    providerData[i].providerId ===
                    firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
                    providerData[i].uid === googleUser.getBasicProfile().getId()
                ) {
                    // We don't need to reauth the Firebase connection.
                    return true;
                }
            }
        }
        return false;
    };

    onSignIn = googleUser => {
        // We need to register an Observer on Firebase Auth to make sure auth is initialized.
        var unsubscribe = firebase.auth().onAuthStateChanged(firebaseUser => {
            unsubscribe();
            // Check if we are already signed-in Firebase with the correct user.
            if (!this.isUserEqual(googleUser, firebaseUser)) {
                // Build Firebase credential with the Google ID token.
                var credential = firebase.auth.GoogleAuthProvider.credential(
                    googleUser.idToken,
                    googleUser.accessToken
                );

                // Sign in with credential from the Google user.
                firebase
                    .auth()
                    .signInWithCredential(credential)
                    .then(function (result) {
                        if (result.additionalUserInfo.isNewUser) {
                            firebase
                                .database()
                                .ref("/users/" + result.user.uid)
                                .set({
                                    gmail: result.user.email,
                                    profile_picture: result.additionalUserInfo.profile.picture,
                                    locale: result.additionalUserInfo.profile.locale,
                                    first_name: result.additionalUserInfo.profile.given_name,
                                    last_name: result.additionalUserInfo.profile.family_name,
                                    current_theme: "dark"
                                })
                                .then(function (snapshot) { });
                        }
                    })
                    .catch(error => {
                        // Handle Errors here.
                        var errorCode = error.code;
                        var errorMessage = error.message;
                        // The email of the user's account used.
                        var email = error.email;
                        // The firebase.auth.AuthCredential type that was used.
                        var credential = error.credential;
                        // ...
                    });
            } else {
                console.log("User already signed-in Firebase.");
            }
        });
    };

    signInWithGoogleAsync = async () => {
        try {
            const result = await Google.logInAsync({
                behaviour: "web",
                androidClientId:
          '555749841419-vp4s8j1nc5e8s9qd905dkn0gfo25cn7u.apps.googleusercontent.com',
        iosClientId:
          '555749841419-i87fi6o50mmbp7o3ir3f2q4du129ij4c.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
            });

            if (result.type === "success") {
                this.onSignIn(result);
                this.props.navigation.navigate("DashboardScreen");
                return result.accessToken;
            } else {
                return { cancelled: true };
            }
        } catch (e) {
            console.log(e.message);
            return { error: true };
        }
    };

    render() {
        return (
            <View style={this.state.light_theme ? styles.containerLight : styles.container}>
                <SafeAreaView style={styles.droidSafeArea} />
                <View style={styles.appTitle}>
                    <Image
                        source={require("../assets/logo.png")}
                        style={styles.appIcon}
                    ></Image>
                    <Text style={styles.appTitleText}>Spectagram</Text>
                </View>
                <View style={this.state.light_theme ? styles.buttonContainerLight : styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => this.signInWithGoogleAsync()}
                    >
                        <Image
                            source={require("../assets/google_icon.png")}
                            style={styles.googleIcon}
                        ></Image>
                        <Text style={styles.this.state.light_theme ? styles.googleTextLight : styles.googleText}>Sign in with Google</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black"
    },
    containerLight: {
        flex: 1,
        backgroundColor: "black"
    },
    droidSafeArea: {
        marginTop: Platform.OS === "android" ? StatusBar.currentHeight : RFValue(35)
    },
    appTitle: {
        flex: 0.4,
        justifyContent: "center",
        alignItems: "center"
    },
    appIcon: {
        width: RFValue(130),
        height: RFValue(130),
        resizeMode: "contain"
    },
    appTitleText: {
        color: "white",
        textAlign: "center",
        fontSize: RFValue(40)
    },
    buttonContainer: {
        flex: 0.3,
        justifyContent: "center",
        alignItems: "center"
    },
    buttonContainerLight: {
        flex: 0.3,
        justifyContent: "center",
        alignItems: "center"
    },
    button: {
        width: RFValue(250),
        height: RFValue(50),
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",
        borderRadius: RFValue(30),
        backgroundColor: "white"
    },
    googleIcon: {
        width: RFValue(30),
        height: RFValue(30),
        resizeMode: "contain"
    },
    googleText: {
        color: "black",
        fontSize: RFValue(20)
    }
    googleTextLight: {
        color: "White",
        fontSize: RFValue(20)
    }
});
