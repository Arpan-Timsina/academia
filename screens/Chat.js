import firestore from "@react-native-firebase/firestore";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import Header from "../components/Header";
import { useUserContext } from "../providers/user";
import { globalStyles, SIZE } from "../styles/globalStyle";

const Chat = ({ navigation }) => {
  const { user } = useUserContext();
  const [conversations, setConversations] = useState([]);
  const { colors } = useTheme();
  const collectionRef = firestore()
    .collection("conversation")
    .where("participants", "array-contains", user.id);

  // const conversationRef = database().ref(`/conversations`).where("participants","")

  useEffect(() => {
    const unsubscribe = collectionRef.onSnapshot(
      { includeMetadataChanges: true },
      (querySnapshot) => {
        setConversations(
          querySnapshot.docs.map((d) => ({ docId: d.id, ...d.data() }))
        );
        console.log(conversations);
      },
      (error) => console.error(error)
    );

    return unsubscribe;
  }, []);

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <Header
        showBackMenu={false}
        title="Message People"
        navigation={navigation}
      />

      <FlatList
        ListEmptyComponent={() => {
          return (
            <View style={{ alignItems: "center", marginTop: 50 }}>
              <Text style={{ color: colors.text }}>No conversations</Text>
            </View>
          );
        }}
        data={conversations}
        keyExtractor={(item) => item.docId}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              backgroundColor: colors.card,
              marginHorizontal: SIZE.width,
              marginVertical: SIZE.height * 0.2,
              paddingHorizontal: SIZE.width * 1,
              paddingVertical: SIZE.height * 0.3,
              borderRadius: 10,
              flexDirection: "row",
              alignItems: "center",
            }}
            onPress={() => {
              navigation.navigate("IndividualChat", {
                id: item.docId,
                name: getChatName(item, user.id),
                conversation: item,
              });
            }}
          >
            <View>
              <Image
                source={{
                  uri: "https://i.pinimg.com/originals/fe/17/83/fe178353c9de5f85fc9f798bc99f4b19.png",
                }}
                style={globalStyles.smallavatar}
              />
            </View>
            <View style={{ marginLeft: SIZE.width }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: colors.text,
                }}
              >
                {getChatName(item, user.id)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default Chat;

const getChatName = (convo, userId) => {
  return convo.group
    ? convo.name
    : convo.p[convo.participants.filter((id) => id != userId)[0]];
};
