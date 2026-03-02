import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { SensorService, Sensor } from '../../services/sensor';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  sensor?: Sensor;
  charts: Chart[] = [];
  isBrowser: boolean;

  // Configuration des graphiques avec type spécifique
  chartConfigs = [
    { 
      id: 'tempChart', 
      label: 'Temperature', 
      color: '#FF6B6B', 
      unit: '°C',
      type: 'line' as const,
      maxValue: 50,
      backgroundColor: 'rgba(255, 107, 107, 0.1)'
    },
    { 
      id: 'heartChart', 
      label: 'Heart Rate', 
      color: '#4ECDC4', 
      unit: 'BPM',
      type: 'line' as const,
      maxValue: 200,
      backgroundColor: 'rgba(78, 205, 196, 0.1)'
    },
    { 
      id: 'stepsChart', 
      label: 'Steps', 
      color: '#45B7D1', 
      unit: '',
      type: 'bar' as const,
      maxValue: 20000,
      backgroundColor: '#45B7D1'
    },
    { 
      id: 'healthChart', 
      label: 'Health Score', 
      color: '#96CEB4', 
      unit: '',
      type: 'bar' as const,
      maxValue: 100,
      backgroundColor: '#96CEB4'
    }
  ];

  constructor(
    private sensorService: SensorService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.sensorService.getLatest().subscribe({
      next: (data) => {
        console.log("DATA:", data);
        this.sensor = data;
        
        this.cdr.detectChanges();

        if (this.isBrowser) {
          setTimeout(() => {
            this.createAllCharts(data);
          }, 100);
        }
      },
      error: (err) => {
        console.error('Erreur chargement données:', err);
      }
    });
  }

  createAllCharts(data: Sensor): void {
    this.destroyAllCharts();
    this.chartConfigs.forEach(config => {
      this.createChart(data, config);
    });
  }

  createChart(data: Sensor, config: { 
    id: string, 
    label: string, 
    color: string, 
    unit: string,
    type: 'line' | 'bar',
    maxValue: number,
    backgroundColor: string
  }): void {
    const ctx = document.getElementById(config.id) as HTMLCanvasElement;

    if (!ctx) {
      console.error(`Canvas element ${config.id} not found`);
      return;
    }

    let value: number;
    let chartData: any;
    let chartLabels: string[];

    switch(config.id) {
      case 'tempChart':
        value = data.temperature;
        break;
      case 'heartChart':
        value = data.heartRate;
        break;
      case 'stepsChart':
        value = data.steps;
        break;
      case 'healthChart':
        value = data.healthScore;
        break;
      default:
        return;
    }

    // Configuration différente selon le type de graphique
    if (config.type === 'line') {
      // Graphique en courbe avec plusieurs points pour simuler une tendance
      chartData = {
        labels: ['Now', '+1h', '+2h', '+3h', '+4h'],
        datasets: [{
          label: config.label,
          data: [
            value,
            value * 1.05,  // +5%
            value * 0.98,   // -2%
            value * 1.02,   // +2%
            value * 1.08    // +8%
          ],
          borderColor: config.color,
          backgroundColor: config.backgroundColor,
          borderWidth: 3,
          pointBackgroundColor: config.color,
          pointBorderColor: '#fff',
          pointRadius: 5,
          pointHoverRadius: 8,
          fill: true,
          tension: 0.4,
          borderDash: [],
          borderDashOffset: 0,
        }]
      };
    } else {
      // Graphique en barres
      chartData = {
        labels: [config.label, ''],
        datasets: [{
          label: config.label,
          data: [value, config.maxValue - value],
          backgroundColor: [
            config.backgroundColor,
            'rgba(255, 252, 252, 0.1)'
          ],
          borderColor: [
            config.color,
            'transparent'
          ],
          borderWidth: 2,
          borderRadius: 8,
          barPercentage: 0.7,
          categoryPercentage: 0.8,
        }]
      };
    }

    // Options communes
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: false 
        },
        tooltip: {
          backgroundColor: 'rgba(254, 250, 250, 0)',
          titleColor: '#fff',
          bodyColor: '#ddd',
          callbacks: {
            label: (context: any) => {
              if (config.type === 'line') {
                return `${config.label}: ${context.parsed.y.toFixed(1)}${config.unit}`;
              } else {
                if (context.dataIndex === 0) {
                  return `${config.label}: ${context.parsed.y}${config.unit}`;
                }
                return undefined;
              }
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: config.maxValue,
          grid: {
            color: 'rgba(0,0,0,0.05)'
          },
          title: {
            display: true,
            text: config.unit,
            color: '#fefbfb'
          },
          ticks: {
        color: '#ffffff', }
        }
      }
    };

    // Ajouter la configuration spécifique pour les axes X selon le type
    if (config.type === 'line') {
      Object.assign(commonOptions, {
        scales: {
          ...commonOptions.scales,
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#ffffff',
              maxRotation: 0,
              autoSkip: true
            }
          }
        }
      });
    } else {
      Object.assign(commonOptions, {
        scales: {
          ...commonOptions.scales,
          x: {
            grid: {
              display: false
            },
            ticks: {
              
              callback: (value: any, index: number) => {
                return index === 0 ? config.label : '';
              }
            }
          }
        }
      });
    }

    // Créer le graphique avec le type approprié
    const chart = new Chart(ctx, {
      type: config.type,
      data: chartData,
      options: commonOptions
    });

    this.charts.push(chart);
    console.log(`Chart ${config.id} created successfully`);
  }

  destroyAllCharts(): void {
    this.charts.forEach(chart => {
      chart.destroy();
    });
    this.charts = [];
  }

  ngOnDestroy(): void {
    this.destroyAllCharts();
  }
}