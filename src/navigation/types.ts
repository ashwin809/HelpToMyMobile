import { NavigatorScreenParams } from '@react-navigation/native';
import { User, UserRole } from '../models';

export type PublicTabParamList = {
  Home: undefined;
  Community: undefined;
  Network: undefined;
  Mentors: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<PublicTabParamList> | undefined;
  AboutUs: undefined;
  FeatureHub: undefined;
  StudyCircles: undefined;
  OfficeHours: undefined;
  Opportunities: undefined;
  LearningGoals: undefined;
  CampusQA: undefined;
  ResourceLibrary: undefined;
  Login: undefined;
  Register: { role?: UserRole } | undefined;
  ProfileSetup: undefined;
  HelpDetail: { requestId: string };
  CreateHelpRequest: { targetUniversity?: string; defaultCategory?: string } | undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
  EditProfile: undefined;
  MentorProfile: { profile: User };
  ChangePassword: undefined;
  AIAssistant: undefined;
  ChatList: undefined;
  ChatThread: { threadId: string; participantName: string };
  BlockedUsers: undefined;
  Notifications: undefined;
};
