import {
    Megaphone,
    Tag,
    Image,
    Star,
    LayoutGrid,
    Clock,
    CircleHelp,
    Mail,
    Building,
    RectangleHorizontal,
    MapPin,
    Eye,
    Maximize,
    PlayCircle,
    FileText,
    MessagesSquare,
    type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
    megaphone: Megaphone,
    tag: Tag,
    photo: Image,
    star: Star,
    'squares-2x2': LayoutGrid,
    clock: Clock,
    'question-mark-circle': CircleHelp,
    envelope: Mail,
    'building-office': Building,
    'rectangle-stack': RectangleHorizontal,
    'map-pin': MapPin,
    eye: Eye,
    'arrows-expand': Maximize,
    'play-circle': PlayCircle,
    'document-text': FileText,
    'chat-bubble-left-right': MessagesSquare,
};

export function getSectionIcon(iconName: string): LucideIcon {
    return iconMap[iconName] ?? LayoutGrid;
}
