import KPICard from './KPICard';

export default {
  title: 'Admin/KPICard',
  component: KPICard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-[#1C1D1F] p-8 w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export const PositiveTrend = {
  args: {
    label: 'Total Courses',
    value: '42',
    change: '5 added this month',
    positive: true,
  },
};

export const NegativeTrend = {
  args: {
    label: 'Active Learners',
    value: '1,204',
    change: '12 dropped this week',
    positive: false,
  },
};