import {
  // Models & AI
  Brain,
  Cpu,
  Database,
  Download,
  Upload,
  HardDrive,
  Package,
  
  // Actions
  Play,
  Pause,
  Square,
  RotateCw,
  Save,
  Trash2,
  Edit3,
  Copy,
  Check,
  X,
  Plus,
  Minus,
  
  // Navigation
  Home,
  Settings,
  Users,
  BarChart3,
  Activity,
  Bell,
  MessageSquare,
  Search,
  Filter,
  Menu,
  
  // Status
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  
  // Files & Data
  File,
  FileText,
  Folder,
  FolderOpen,
  
  // Others
  Globe,
  Github,
  Cloud,
  Zap,
  TrendingUp,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  MoreVertical
} from 'lucide-react';

export const Icons = {
  // Models & AI
  brain: Brain,
  cpu: Cpu,
  database: Database,
  download: Download,
  upload: Upload,
  hardDrive: HardDrive,
  package: Package,
  
  // Actions
  play: Play,
  pause: Pause,
  stop: Square,
  refresh: RotateCw,
  save: Save,
  delete: Trash2,
  edit: Edit3,
  copy: Copy,
  check: Check,
  close: X,
  plus: Plus,
  minus: Minus,
  
  // Navigation
  home: Home,
  settings: Settings,
  users: Users,
  chart: BarChart3,
  activity: Activity,
  bell: Bell,
  message: MessageSquare,
  search: Search,
  filter: Filter,
  menu: Menu,
  
  // Status
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  spinner: Loader2,
  loader: Loader2,
  
  // Files & Data
  file: File,
  fileText: FileText,
  folder: Folder,
  folderOpen: FolderOpen,
  
  // Others
  globe: Globe,
  github: Github,
  cloud: Cloud,
  zap: Zap,
  trending: TrendingUp,
  eye: Eye,
  eyeOff: EyeOff,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  externalLink: ExternalLink,
  more: MoreVertical
};

export type IconName = keyof typeof Icons;
