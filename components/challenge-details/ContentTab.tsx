import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const ARTICLES = [
  { 
    id: '1', 
    title: "Qu'est-ce que le Coran ?", 
    content: "Le Coran est le livre sacré de l'islam, considéré par les musulmans comme la parole de Dieu (Allah) révélée au prophète Mahomet (Muhammad) par l'archange Gabriel (Jibril). Il est le texte central de la foi islamique et guide la vie des croyants."
  },
  { 
    id: '2', 
    title: "Comment le Coran a t-il était révélé ?", 
    content: "Le Coran a été révélé progressivement sur une période de 23 ans, commençant en 610 après J.C. lorsque le Prophète avait 40 ans. La révélation s'est faite par l'intermédiaire de l'archange Gabriel, parfois en réponse à des événements spécifiques ou des questions posées."
  },
  { 
    id: '3', 
    title: "Les adeptes du Coran.", 
    content: "Les adeptes du Coran sont les musulmans qui suivent ses enseignements. Ils s'efforcent de comprendre, réciter et appliquer ses préceptes dans leur vie quotidienne, considérant le livre comme une source de guidée spirituelle, morale et juridique."
  },
  { 
    id: '4', 
    title: "La méditation du Coran", 
    content: "La méditation du Coran (Tadabbur) est fortement encouragée. Elle consiste à réfléchir profondément sur le sens des versets, leurs implications et leurs leçons, plutôt que de simplement les lire sans compréhension. C'est un moyen de renforcer sa foi et sa connexion avec Dieu."
  },
  { 
    id: '5', 
    title: "La mise en pratique de la science.", 
    content: "En islam, la connaissance (Ilm) doit être suivie par l'action (Amal). Apprendre le Coran implique non seulement la mémorisation mais aussi l'application de ses enseignements. La science sans pratique est considérée comme stérile."
  },
  { 
    id: '6', 
    title: "L'effort dans la récitation du Coran.", 
    content: "L'effort pour bien réciter le Coran est récompensé. Le Prophète a dit que celui qui récite le Coran avec difficulté a une double récompense : une pour la lecture et une pour l'effort. La récitation embellie (Tajwid) est également une pratique importante."
  },
  { 
    id: '7', 
    title: "La patience dans la recherche de la science.", 
    content: "Acquérir la connaissance religieuse demande du temps et de la patience. Les érudits musulmans ont toujours valorisé la persévérance (Sabr) dans l'étude, car la compréhension profonde ne vient pas instantanément mais par l'étude continue et la réflexion."
  },
];

export default function ContentTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={ARTICLES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id;
          return (
            <Pressable 
              style={[styles.card, isExpanded && styles.cardExpanded]} 
              onPress={() => toggleExpand(item.id)}
            >
              <View style={styles.indicatorBar} />
              <View style={styles.cardContent}>
                <View style={styles.headerRow}>
                  <Text style={[styles.cardTitle, isExpanded && styles.cardTitleExpanded]}>{item.title}</Text>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={isExpanded ? "#670FA4" : "#999"} 
                  />
                </View>
                {isExpanded && (
                  <View style={styles.bodyContainer}>
                    <Text style={styles.bodyText}>{item.content}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 16,
    paddingRight: 16,
    paddingLeft: 0, // Left padding handled by indicator/margin
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  cardExpanded: {
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  indicatorBar: {
    width: 4,
    backgroundColor: '#D4A84A', // Gold/Orange
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    paddingRight: 8,
    fontFamily: 'Metropolis-Medium',
  },
  cardTitleExpanded: {
    color: '#670FA4',
    fontFamily: 'Metropolis-Bold',
  },
  bodyContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  bodyText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    fontFamily: 'Metropolis-Regular',
  },
});
