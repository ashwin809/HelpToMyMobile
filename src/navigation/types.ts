import { NavigatorScreenParams } from '@react-navigation/native';
import { UserRole } from '../models';

export type PublicTabParamList = {
  Community: undefined;
  Chats: undefined;
  Mentors: undefined;
  AboutUs: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<PublicTabParamList> | undefined;
  Login: undefined;
  Register: { role?: UserRole } | undefined;
  HelpDetail: { requestId: string };
  CreateHelpRequest: { targetUniversity?: string; defaultCategory?: string } | undefined;
  ForgotPassword: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  AIAssistant: undefined;
  ChatList: undefined;
  ChatThread: { threadId: string; participantName: string };
  BlockedUsers: undefined;
  Notifications: undefined;
};
