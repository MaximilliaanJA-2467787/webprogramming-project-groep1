document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('categoryPieChart');
  if (!canvas) return;

  // Data uit EJS (globale variabele)
  const chartData = window.categoryChartData;
  if (!chartData) return;

  new Chart(canvas.getContext('2d'), {
    type: 'pie',
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} tokens (${percentage}%)`;
            }
          }
        }
      }
    }
  });
});
