import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useAppSelector } from '@/store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface ConditionsModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
}

export default function ConditionsModal({ visible, onClose, title = "Les Conditions" }: ConditionsModalProps) {
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
            <LinearGradient
                colors={[Colors.palette.purple.primary, '#E6B980']}
                locations={[0, 1]}
                style={styles.gradientBackground}
            >
                {/* Close Button */}
                <Pressable style={styles.closeButton} onPress={onClose}>
                    <Ionicons name="close" size={28} color="#000" />
                </Pressable>

                {/* Content */}
                <View style={styles.contentContainer}>
                    <Ionicons name="apps" size={32} color="#FFF" style={{ alignSelf: 'center', marginBottom: 20 }} />
                    
                    <Text style={[styles.title, { fontFamily: fontBold }]}>{title}</Text>
                    
                    <Text style={[styles.bismillah, { fontFamily: fontMedium }]}>
                        Au nom d’Allah, le Tout Miséricordieux,{'\n'}le Très Miséricordieux.
                    </Text>

                    <Text style={[styles.bodyText, { fontFamily: fontRegular }]}>
                        La lecture du Coran est une adoration qui illumine le coeur et guide l'âme.
                        {'\n\n'}
                        Il est recommandé d'être en état de pureté (Woudou) pour toucher le Moushaf.
                        {'\n\n'}
                        Prenez le temps de méditer sur les versets et de les comprendre.
                        {'\n\n'}
                        Ne cherchez pas la rapidité, mais la régularité et la sincérité.
                    </Text>

                    <Text style={[styles.footerText, { fontFamily: fontMedium }]}>
                        Dans ce challenge, nous avancerons ensemble vers la satisfaction d'Allah.
                        {'\n\n'}
                        A votre rythme ...
                    </Text>
                </View>
            </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '90%',
    height: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  gradientBackground: {
      flex: 1,
      padding: 24,
  },
  closeButton: {
      position: 'absolute',
      right: 20,
      top: 20,
      zIndex: 10,
  },
  contentContainer: {
      flex: 1,
      justifyContent: 'center',
  },
  title: {
      fontSize: 22,
      color: '#FFF',
      textAlign: 'center',
      marginBottom: 30,
  },
  bismillah: {
      fontSize: 16,
      color: '#FFF',
      textAlign: 'center',
      marginBottom: 30,
      lineHeight: 24,
  },
  bodyText: {
      fontSize: 16,
      color: '#FFF',
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 30,
  },
  footerText: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 24,
  }
});
