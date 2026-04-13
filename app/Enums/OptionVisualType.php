<?php

namespace App\Enums;

enum OptionVisualType: string
{
    case Dropdown = 'dropdown';
    case ColorSwatch = 'color_swatch';
    case ButtonGroup = 'button_group';
    case ImageSwatch = 'image_swatch';

    public function label(): string
    {
        return match ($this) {
            self::Dropdown => 'Dropdown',
            self::ColorSwatch => 'Color Swatch',
            self::ButtonGroup => 'Button Group',
            self::ImageSwatch => 'Image Swatch',
        };
    }
}
