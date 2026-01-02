import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import i18n from '@/locales/i18n';
import { QuizCategory, socialService } from '@/services/socialService';
import { useAppSelector } from '@/store/hooks';
import { generateRoomId } from '@/utils/roomGenerator';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Socket } from 'socket.io-client';

const SOCKET_URL = 'http://192.168.1.16:3000'; // Replace with your backend URL

export default function ChallengeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const user = useAppSelector(state => state.user);
  const currentLanguage = useAppSelector(state => state.language.currentLanguage);
  
  const fontMedium = getFont(currentLanguage, 'medium');
  const t = (key: string) => i18n.t(key, { locale: currentLanguage });
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(true); // Default matching UI for dev
  
  // UI State for Entry
  const [entryMode, setEntryMode] = useState<'menu' | 'join'>('menu');

  const [roomId, setRoomId] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [gameState, setGameState] = useState<'waiting' | 'playing'>('waiting');
  
  // ... (keep state for players, scores, messages, game logic)

  // ... (keep useEffect for socket)
  


  const joinRoom = () => {
      if (!roomId.trim() || !socket) return;
      socket.emit('join_room', { 
          roomId: roomId.toUpperCase(), // Ensure uppercase
          username: user?.name || 'Guest', 
          userId: user?.id || 'guest_id' 
      });
      setInRoom(true);
  };
  
  // ... (keep startGame, sendMessage, shareRoom)

  // Render Helpers
  const renderEntryMenu = () => (
      <View style={styles.entryContainer}>
           <Text style={styles.heroTitle}>Challenge</Text>
           <Text style={styles.heroSubtitle}>{t('features.subtitle')}</Text>

           <View style={styles.buttonGroup}>
               <Pressable 
                style={[styles.mainButton, { backgroundColor: '#10B981' }]} 
                onPress={handleCreateRoom}
               >
                   <Ionicons name="add-circle-outline" size={32} color="#FFF" />
                   <Text style={styles.mainButtonText}>{t('challenge.createRoom')}</Text>
               </Pressable>

               <Pressable 
                style={[styles.mainButton, { backgroundColor: '#3B82F6' }]} 
                onPress={() => setEntryMode('join')}
               >
                   <Ionicons name="enter-outline" size={32} color="#FFF" />
                   <Text style={styles.mainButtonText}>{t('challenge.joinRoom')}</Text>
               </Pressable>
           </View>
      </View>
  );

  const renderJoinScreen = () => (
      <View style={styles.joinContainer}>
            <Pressable onPress={() => setEntryMode('menu')} style={styles.backToMenu}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
                <Text style={{color: '#FFF', marginLeft: 8}}>{t('common.back')}</Text>
            </Pressable>

           <Text style={styles.label}>{t('challenge.enterRoomId')}</Text>
           <TextInput
             style={styles.inputField}
             value={roomId}
             onChangeText={setRoomId}
             placeholder="e.g. A3X9L2"
             placeholderTextColor="#666"
             autoCapitalize="characters"
             maxLength={6}
           />
           <Pressable style={styles.joinButton} onPress={joinRoom}>
               <Text style={styles.joinButtonText}>{t('challenge.joinRoom')}</Text>
           </Pressable>
      </View>
  );

  // ... imports


// ... inside component

  const [categories, setCategories] = useState<QuizCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const cats = await socialService.getQuizCategories();
    setCategories(cats);
  };

  const handleCreateRoom = () => {
      const newRoomId = generateRoomId();
      setRoomId(newRoomId);
      setInRoom(true); // Allow entering room even if socket is null for UI dev

      if (socket) {
          socket.emit('join_room', { 
            roomId: newRoomId, 
            username: user?.name || t('challenge.host'), 
            userId: user?.id || 'host_id' 
          });
      }
  };

  // ... other functions

  const renderLobby = () => (
      <View style={styles.lobbyContainer}>
          <View style={styles.lobbyHeader}>
              <View>
                  <Text style={styles.title}>{t('challenge.lobby')}</Text>
                  <Text style={styles.subtitle}>Room ID: {roomId}</Text>
              </View>
              <Pressable style={styles.shareBtn} onPress={async () => {
                  try {
                      await Share.share({
                          message: t('challenge.shareMessage').replace('{roomId}', roomId),
                      });
                  } catch (error) {
                      console.error('Share error:', error);
                  }
              }}>
                  <Ionicons name="share-outline" size={24} color="#FFF" />
              </Pressable>
          </View>

          <View style={{flex: 1}}>
              <Text style={[styles.sectionTitle, {color: '#FFF', marginBottom: 10}]}>{t('challenge.roomSettings')}</Text>
              
              <Text style={[styles.label, {fontSize: 14, color: '#9CA3AF'}]}>{t('challenge.selectSubject')}</Text>
              <View style={styles.categoriesGrid}>
                  {categories.map((cat) => (
                      <Pressable 
                          key={cat.id} 
                          style={[
                              styles.categoryChip, 
                              selectedCategory === cat.id && styles.categoryChipSelected
                          ]}
                          onPress={() => setSelectedCategory(cat.id)}
                      >
                          <Text style={[
                              styles.categoryChipText,
                              selectedCategory === cat.id && styles.categoryChipTextSelected
                          ]}>{cat.name}</Text>
                      </Pressable>
                  ))}
              </View>

              <Text style={[styles.sectionTitle, {color: '#FFF', marginTop: 20, marginBottom: 10}]}>{t('challenge.players')}</Text>
              <View style={styles.playerRow}>
                  <Text style={styles.playerText}>{user?.name || t('challenge.you')}</Text>
                  <Text style={styles.scoreText}>{t('challenge.host')}</Text>
              </View>
          </View>

          <Pressable 
            style={[styles.startButton, !selectedCategory && styles.startButtonDisabled]} 
            onPress={() => {
                if (selectedCategory) setGameState('playing');
            }}
            disabled={!selectedCategory}
          >
              <Text style={styles.startButtonText}>{t('challenge.startGame')}</Text>
          </Pressable>
          
          <Text style={{color: '#9CA3AF', textAlign: 'center', marginTop: 10}}>{t('challenge.waitingForHost')}</Text>
      </View>
  );

  const renderGame = () => (
      <View style={styles.gameContainer}>
          <Text style={styles.title}>{t('challenge.gameInProgress')}</Text>
          <Text style={styles.subtitle}>{t('challenge.question')} 1/10</Text>
          {/* Game UI placeholder */}
          <Pressable style={styles.actionButton} onPress={() => setGameState('waiting')}>
              <Text style={{color: '#000', fontWeight: 'bold'}}>{t('challenge.endGame')}</Text>
          </Pressable>
      </View>
  );

  return (
    <SafeAreaView style={styles.container}>
       <LinearGradient
          colors={['#1F2937', '#111827']}
          style={styles.background}
       />
       
       <View style={styles.header}>
           <Pressable onPress={() => router.back()} style={styles.backBtn}>
               <Ionicons name="arrow-back" size={24} color="#FFF" />
           </Pressable>
           <Text style={styles.headerTitle}>Challenge Mode</Text>
       </View>
       
       {!connected ? (
           <View style={styles.center}>
               <ActivityIndicator size="large" color="#F59E0B" />
               <Text style={styles.waitingText}>{t('challenge.connecting')}</Text>
           </View>
       ) : !inRoom ? (
           entryMode === 'menu' ? renderEntryMenu() : renderJoinScreen()
       ) : (
           gameState === 'waiting' ? renderLobby() : renderGame()
       )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  waitingText: { color: '#FFF', marginTop: 10 },
  joinContainer: { padding: 24, justifyContent: 'center', flex: 1 },
  label: { color: '#FFF', marginBottom: 8, fontSize: 16 },
  inputField: { backgroundColor: '#374151', color: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16, fontSize: 18, textAlign: 'center', letterSpacing: 2 },
  joinButton: { backgroundColor: '#F59E0B', padding: 16, borderRadius: 12, alignItems: 'center' },
  joinButtonText: { fontWeight: 'bold', color: '#000' },
  lobbyContainer: { flex: 1, padding: 20 },
  lobbyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  shareBtn: { padding: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  subtitle: { fontSize: 18, color: '#ccc', marginBottom: 10 },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#374151', marginBottom: 8, borderRadius: 8 },
  playerText: { color: '#FFF' },
  scoreText: { color: '#F59E0B', fontWeight: 'bold' },
  startButton: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', marginVertical: 20 },
  startButtonText: { color: '#FFF', fontWeight: 'bold' },
  chatContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, overflow: 'hidden' },
  chatList: { flex: 1, padding: 10 },
  chatMessage: { color: '#FFF', marginBottom: 6 },
  inputRow: { flexDirection: 'row', padding: 10, backgroundColor: '#374151', alignItems: 'center' },
  input: { flex: 1, color: '#FFF', marginRight: 10 },
  gameContainer: { flex: 1, padding: 20, alignItems: 'center' },
  actionButton: { backgroundColor: '#FFF', padding: 20, margin: 20, borderRadius: 10 },
  
  // New Styles
  entryContainer: { flex: 1, justifyContent: 'center', padding: 20, alignItems: 'center' },
  heroTitle: { fontSize: 32, fontWeight: 'bold', color: '#F59E0B', marginBottom: 8 },
  heroSubtitle: { fontSize: 16, color: '#9CA3AF', marginBottom: 40, textAlign: 'center' },
  buttonGroup: { width: '100%', gap: 16 },
  mainButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5
  },
  mainButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 12 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#4B5563', backgroundColor: '#374151', marginRight: 8, marginBottom: 8 },
  categoryChipSelected: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  categoryChipText: { color: '#D1D5DB', fontSize: 14, fontWeight: '600' },
  categoryChipTextSelected: { color: '#000' },
  startButtonDisabled: { opacity: 0.5, backgroundColor: '#6B7280' },
  backToMenu: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 }
});
