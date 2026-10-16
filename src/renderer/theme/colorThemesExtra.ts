import type { ColorTheme } from './colorThemes'

export const EXTRA_COLOR_THEMES: ColorTheme[] = [
  {
    id: 'tango-dark',
    label: 'Tango Dark',
    background: '#1E1E1E',
    foreground: '#D3D7CF',
    cursor: '#D3D7CF',
    selection: '#3C3C3C',
    code: {
      keyword: '#729FCF', string: '#8AE234', number: '#FCE94F', comment: '#888A85', functionName: '#34E2E2',
      typeName: '#AD7FA8', property: '#FCAF3E', htmlTag: '#EF2929', attribute: '#FCAF3E', punctuation: '#BABDB6',
      link: '#729FCF', variable: '#FCAF3E'
    },
    ansi: ['#2E3436', '#CC0000', '#4E9A06', '#C4A000', '#3465A4', '#75507B', '#06989A', '#D3D7CF', '#555753', '#EF2929', '#8AE234', '#FCE94F', '#729FCF', '#AD7FA8', '#34E2E2', '#EEEEEC']
  },
  {
    id: 'rose-pine',
    label: 'Rose Pine',
    background: '#191724',
    foreground: '#E0DEF4',
    cursor: '#524F67',
    selection: '#403D52',
    code: {
      keyword: '#31748F', string: '#F6C177', number: '#EA9A97', comment: '#6E6A86', functionName: '#EBBCBA',
      typeName: '#9CCFD8', property: '#C4A7E7', htmlTag: '#EB6F92', attribute: '#C4A7E7', punctuation: '#908CAA',
      link: '#9CCFD8', variable: '#EA9A97'
    },
    ansi: ['#26233A', '#EB6F92', '#31748F', '#F6C177', '#9CCFD8', '#C4A7E7', '#EBBCBA', '#E0DEF4', '#6E6A86', '#EB6F92', '#31748F', '#F6C177', '#9CCFD8', '#C4A7E7', '#EBBCBA', '#E0DEF4']
  },
  {
    id: 'nord',
    label: 'Nord',
    background: '#2E3440',
    foreground: '#D8DEE9',
    cursor: '#D8DEE9',
    selection: '#434C5E',
    code: {
      keyword: '#81A1C1', string: '#A3BE8C', number: '#B48EAD', comment: '#616E88', functionName: '#88C0D0',
      typeName: '#8FBCBB', property: '#D8DEE9', htmlTag: '#81A1C1', attribute: '#8FBCBB', punctuation: '#ECEFF4',
      link: '#88C0D0', variable: '#D08770'
    },
    ansi: ['#3B4252', '#BF616A', '#A3BE8C', '#EBCB8B', '#81A1C1', '#B48EAD', '#88C0D0', '#E5E9F0', '#4C566A', '#BF616A', '#A3BE8C', '#EBCB8B', '#81A1C1', '#B48EAD', '#8FBCBB', '#ECEFF4']
  },
  {
    id: 'gruvbox-dark',
    label: 'Gruvbox Dark',
    background: '#282828',
    foreground: '#EBDBB2',
    cursor: '#EBDBB2',
    selection: '#504945',
    code: {
      keyword: '#FB4934', string: '#B8BB26', number: '#D3869B', comment: '#928374', functionName: '#FABD2F',
      typeName: '#83A598', property: '#8EC07C', htmlTag: '#FB4934', attribute: '#FABD2F', punctuation: '#A89984',
      link: '#83A598', variable: '#FE8019'
    },
    ansi: ['#282828', '#CC241D', '#98971A', '#D79921', '#458588', '#B16286', '#689D6A', '#A89984', '#928374', '#FB4934', '#B8BB26', '#FABD2F', '#83A598', '#D3869B', '#8EC07C', '#EBDBB2']
  },
  {
    id: 'tokyo-night',
    label: 'Tokyo Night',
    background: '#1A1B26',
    foreground: '#C0CAF5',
    cursor: '#C0CAF5',
    selection: '#33467C',
    code: {
      keyword: '#BB9AF7', string: '#9ECE6A', number: '#FF9E64', comment: '#565F89', functionName: '#7AA2F7',
      typeName: '#2AC3DE', property: '#73DACA', htmlTag: '#F7768E', attribute: '#BB9AF7', punctuation: '#89DDFF',
      link: '#7DCFFF', variable: '#E0AF68'
    },
    ansi: ['#15161E', '#F7768E', '#9ECE6A', '#E0AF68', '#7AA2F7', '#BB9AF7', '#7DCFFF', '#A9B1D6', '#414868', '#F7768E', '#9ECE6A', '#E0AF68', '#7AA2F7', '#BB9AF7', '#7DCFFF', '#C0CAF5']
  },
  {
    id: 'catppuccin-mocha',
    label: 'Catppuccin Mocha',
    background: '#1E1E2E',
    foreground: '#CDD6F4',
    cursor: '#F5E0DC',
    selection: '#45475A',
    code: {
      keyword: '#CBA6F7', string: '#A6E3A1', number: '#FAB387', comment: '#6C7086', functionName: '#89B4FA',
      typeName: '#F9E2AF', property: '#F2CDCD', htmlTag: '#F38BA8', attribute: '#F9E2AF', punctuation: '#9399B2',
      link: '#89DCEB', variable: '#EBA0AC'
    },
    ansi: ['#45475A', '#F38BA8', '#A6E3A1', '#F9E2AF', '#89B4FA', '#F5C2E7', '#94E2D5', '#BAC2DE', '#585B70', '#F38BA8', '#A6E3A1', '#F9E2AF', '#89B4FA', '#F5C2E7', '#94E2D5', '#A6ADC8']
  },
  {
    id: 'night-owl',
    label: 'Night Owl',
    background: '#011627',
    foreground: '#D6DEEB',
    cursor: '#80A4C2',
    selection: '#1D3B53',
    code: {
      keyword: '#C792EA', string: '#ECC48D', number: '#F78C6C', comment: '#637777', functionName: '#82AAFF',
      typeName: '#FFCB8B', property: '#7FDBCA', htmlTag: '#CAECE6', attribute: '#C5E478', punctuation: '#89DDFF',
      link: '#82AAFF', variable: '#ADDB67'
    },
    ansi: ['#011627', '#EF5350', '#22DA6E', '#ADDB67', '#82AAFF', '#C792EA', '#21C7A8', '#FFFFFF', '#575656', '#EF5350', '#22DA6E', '#FFEB95', '#82AAFF', '#C792EA', '#7FDBCA', '#FFFFFF']
  },
  {
    id: 'ayu-dark',
    label: 'Ayu Dark',
    background: '#0B0E14',
    foreground: '#BFBDB6',
    cursor: '#E6B450',
    selection: '#273747',
    code: {
      keyword: '#FF8F40', string: '#AAD94C', number: '#D2A6FF', comment: '#5C6773', functionName: '#FFB454',
      typeName: '#59C2FF', property: '#39BAE6', htmlTag: '#39BAE6', attribute: '#FFB454', punctuation: '#BFBDB6',
      link: '#59C2FF', variable: '#E6B673'
    },
    ansi: ['#01060E', '#EA6C73', '#91B362', '#F9AF4F', '#53BDFA', '#FAE994', '#90E1C6', '#C7C7C7', '#686868', '#F07178', '#C2D94C', '#FFB454', '#59C2FF', '#FFEE99', '#95E6CB', '#FFFFFF']
  }
]
