import Button from './Button';

export default {
  title: 'Common/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    onClick: { action: 'clicked' },
    disabled: { control: 'boolean' },
    type: {
      control: { type: 'select' },
      options: ['button', 'submit', 'reset'],
    },
  },
};

export const Primary = {
  args: {
    label: 'Continue',
    disabled: false,
  },
};

export const Loading = {
  args: {
    label: 'Authenticating...',
    disabled: true,
  },
};