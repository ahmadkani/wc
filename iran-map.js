class IranMapComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.tooltip = null;
    this.svg = null;
    this.geoData = null;
    this.statisticsData = null;
    this.choroplethMap = null;
    this.normalizeScale = null;
    this.colorScale = null;
    this.stateProperties = null;
    this.selectedMetric = null;
    this.currentPalette = 'schemeBlues';
  }

  connectedCallback() {
    this.mapTitle = this.getAttribute('map-title');
    this.mapData = JSON.parse(this.getAttribute('map-data'));
    
    this.render();
  }

  async render() {
    this.setupMapContainer();
    this.createColorPaletteSelector();
    await this.loadData();
    this.createProjectionAndPath();
    this.createMetricSelector();
    this.setupTooltip();
    this.setupStyles();
    this.createRegions();
    this.createLabels();
    this.createTitle();
    this.createSelectedPaletteDisplay();
    this.handleColorPaletteChange('schemeBlues');
  }

  setupMapContainer() {
    this.svgWidth = 800;
    this.svgHeight = 600;
    this.svg = d3.create('svg')
      .attr('width', this.svgWidth)
      .attr('height', this.svgHeight);
    
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(this.svg.node());
  }

  createColorPaletteSelector() {
    const paletteSelectorContainer = document.createElement('div');
    paletteSelectorContainer.classList.add('palette-selector-container');
    
    const paletteButton = document.createElement('button');
    paletteButton.classList.add('palette-button');
    paletteButton.textContent = 'Select Palette';
    paletteSelectorContainer.appendChild(paletteButton);
  
    const paletteDropdown = document.createElement('div');
    paletteDropdown.classList.add('palette-dropdown');
    paletteDropdown.style.display = 'none';
    
    const palettes = [
      'schemeBlues',
      'schemeGreens',
      'schemeReds',
      'schemePurples',
      'schemeOranges',
      'schemeGreys',
      'schemeBuGn',
      'schemeBuPu',
      'schemeGnBu',
      'schemeOrRd',
      'schemePuBuGn',
      'schemePuBu',
      'schemePuRd',
      'schemeRdPu',
      'schemeYlGnBu',
      'schemeYlGn',
      'schemeYlOrBr',
      'schemeYlOrRd'
    ];
    
    palettes.forEach(palette => {
      const paletteItem = document.createElement('div');
      paletteItem.classList.add('palette-item');
      paletteItem.textContent = palette;
      paletteItem.style.background = this.getPaletteBackground(palette);
      paletteItem.style.color = 'white';
      paletteItem.style.padding = '5px';
      paletteItem.addEventListener('click', () => this.handleColorPaletteChange(palette));
      paletteDropdown.appendChild(paletteItem);
    });
  
    paletteButton.addEventListener('click', () => {
      const isVisible = paletteDropdown.style.display === 'block';
      paletteDropdown.style.display = isVisible ? 'none' : 'block';
    });
  
    paletteSelectorContainer.appendChild(paletteDropdown);
    
    this.shadowRoot.insertBefore(paletteSelectorContainer, this.svg.node());
  }

  getPaletteBackground(paletteName) {
    const colorScheme = d3[paletteName][9];
    return `linear-gradient(to right, ${colorScheme.map(color => color).join(', ')})`;
  }

  handleColorPaletteChange(paletteName) {
    this.currentPalette = paletteName;
    this.colorScale = d3.scaleQuantize()
      .domain([0, 1000])
      .range(d3[paletteName][9]);
  
    this.updateRegions();
  
    this.selectedPaletteDisplay.style.background = this.getPaletteBackground(paletteName);
  
    const paletteButton = this.shadowRoot.querySelector('.palette-button');
    paletteButton.textContent = `Selected: ${paletteName}`;
    
    const paletteDropdown = this.shadowRoot.querySelector('.palette-dropdown');
    paletteDropdown.style.display = 'none';
  }
  

  createSelectedPaletteDisplay() {
    const selectedPaletteContainer = document.createElement('div');
    selectedPaletteContainer.classList.add('selected-palette-container');
    
    this.selectedPaletteDisplay = document.createElement('div');
    this.selectedPaletteDisplay.classList.add('selected-palette-display');
    
    const textContainer = document.createElement('div');
    textContainer.classList.add('selected-palette-display-text-container');

    this.bottomLeftText = document.createElement('div');
    this.bottomLeftText.classList.add('bottom-left-text');
    this.bottomLeftText.textContent = 'کم';
    
    this.bottomRightText = document.createElement('div');
    this.bottomRightText.classList.add('bottom-right-text');
    this.bottomRightText.textContent = 'زیاد';
    
    selectedPaletteContainer.appendChild(this.selectedPaletteDisplay);
    textContainer.appendChild(this.bottomLeftText);
    textContainer.appendChild(this.bottomRightText);
    selectedPaletteContainer.appendChild(textContainer);
    
    this.shadowRoot.appendChild(selectedPaletteContainer);
  }  

  updateRegions() {
    this.svg.selectAll('.state-drawing path')
      .attr('fill', d => this.getRegionColor(d));
  }

  async loadData() {
    try {
      this.geoData = await d3.json('./geo_jsons/iran1400.geojson');
      this.stateProperties = await d3.json('./data/states_properties.json');
      this.statisticsData = this.mapData
      this.setupChoroplethMap();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  setupChoroplethMap(isFirstSetup = true) {
    if (isFirstSetup) {
      this.selectedMetric = Object.keys(this.statisticsData[0]).find(key => key != 'استان')
    }

    this.choroplethMap = new Map(
      this.statisticsData.map(d => [d["استان"], d[this.selectedMetric]])
    );

    this.setupScale();
  }

  setupScale() {
    const values = this.statisticsData.map(d => d[this.selectedMetric]);
    const minValue = d3.min(values);
    const maxValue = d3.max(values);
    const maxThreshold = 10000000;
  
    this.normalizeScale = d3.scaleLinear()
      .domain([minValue, Math.min(maxValue, maxThreshold)])
      .range([0, 1000]);
  
    this.colorScale = d3.scaleQuantize()
      .domain([0, 1000])
      .range(d3[this.currentPalette][9]);
  }
  

  setupTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.classList.add('tooltip');
    this.shadowRoot.appendChild(this.tooltip);
  }

  setupStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .tooltip {
        position: absolute;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 5px;
        border-radius: 4px;
        pointer-events: none;
        display: none;
        font-size: 12px;
        white-space: nowrap;
        z-index: 10;
      }

      .state-names text {
        pointer-events: none;
        font-weight: bold;
      }

      h1 {
        color: dodgerblue;
      }

      .palette-selector-container {
        position: absolute;
        top: 20px;
        left: 20px;
        z-index: 30;
        display: inline-block;
      }

      .palette-button {
        background-color: #4CAF50;
        color: white;
        padding: 10px;
        font-size: 14px;
        border: none;
        cursor: pointer;
        border-radius: 5px;
        display: inline-block;
      }

      .palette-dropdown {
        display: none;
        position: absolute;
        top: 35px; /* Make sure this doesn't overlap the button */
        left: 0;
        background-color: #fff;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        width: 200px;
        z-index: 30;
      }

      .palette-item {
        padding: 10px;
        cursor: pointer;
      }

      .palette-item:hover {
        background-color: #f1f1f1;
      }

      .selected-palette-container {
        position: absolute;
        left: 20px;
        bottom: 20px;
        width: 15%;
        text-align: center;
      }

      .selected-palette-display {
        width: 100%;
        height: 30px;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
      
      .selected-palette-display-text-container {
        display: flex;
        flex-direction: row-reverse;
        justify-content: space-between;
        width: 100%;
        margin-top: 8px;
      }

      .bottom-left-text {
        font-size: 14px;
        color: black;
      }

      .bottom-right-text {
        font-size: 14px;
        color: black;
      }

      .metric-selector-container {
        position: absolute;
        top: 70px; /* Adjust as needed to avoid overlapping */
        left: 20px;
        z-index: 20;
        display: inline-block;
      }

      .metric-selector-container select {
        padding: 5px;
        font-size: 14px;
        border: 1px solid #ddd;
        border-radius: 5px;
      }
    `;
    this.shadowRoot.appendChild(styleElement);
  }

  createTitle() {
    if (this.mapTitle) {
      const titleElement = document.createElement('h1');
      titleElement.classList.add('map-title');
      titleElement.textContent = this.mapTitle;
      this.shadowRoot.insertBefore(titleElement, this.svg.node());
    }
  }

  createProjectionAndPath() {
    this.projection = d3.geoIdentity().reflectY(true).fitSize([this.svgWidth, this.svgHeight], this.geoData);
    this.path = d3.geoPath().projection(this.projection);
  }

  createRegions() {
    this.svg.append('g')
      .attr('class', 'state-drawing')
      .selectAll('path')
      .data(this.geoData.features)
      .join('path')
      .attr('d', this.path)
      .attr('fill', d => this.getRegionColor(d))
      .attr('stroke', '#000')
      .attr('stroke-width', 0.5)
      .on('mouseover', this.handleMouseOver.bind(this))
      .on('mouseout', this.handleMouseOut.bind(this))
      .on('mousemove', this.handleMouseMove.bind(this));    
  }

  getRegionColor(d) {
    const provinceName = d.properties.name;
    const value = this.choroplethMap.get(provinceName);
    const normalizedValue = value ? this.normalizeScale(value) : 0;
    return this.colorScale(normalizedValue);
  }

  handleMouseOver(event, d) {
    const provinceName = d.properties.name;
    const regionData = this.statisticsData.find(item => item["استان"] === provinceName);
  
    if (regionData) {
      const value = regionData[this.selectedMetric];
      const label = this.selectedMetric;
  
      this.tooltip.style.display = 'block';
      this.tooltip.textContent = `${label}: ${value}`;
      this.tooltip.style.left = `${event.pageX + 5}px`;
      this.tooltip.style.top = `${event.pageY + 5}px`;
  
      d3.select(event.currentTarget).attr('fill', '#ffcc00');
    }
  }

  handleMouseOut(event, d) {
    const provinceName = d.properties.name;
    const value = this.choroplethMap.get(provinceName);
    const normalizedValue = value ? this.normalizeScale(value) : 0;

    this.tooltip.style.display = 'none';

    d3.select(event.currentTarget).attr('fill', this.colorScale(normalizedValue));
  }

  handleMouseMove(event) {
    this.tooltip.style.left = `${event.clientX + 5}px`;
    this.tooltip.style.top = `${event.clientY + 5}px`;
  }

  createLabels() {
    this.svg.append('g')
      .attr('class', 'state-names')
      .selectAll('text')
      .data(this.geoData.features)
      .join('text')
      .attr('x', d => this.getAdjustedXPosition(d))
      .attr('y', d => this.getAdjustedYPosition(d))
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', d => this.getLabelFontSize(d))
      .style('fill', d => this.getContrastColor(this.colorScale(this.normalizeScale(this.choroplethMap.get(d.properties.name)))) )
      .each(function(d) {
        const textElement = d3.select(this);
        const labelText = d.properties.name || 'Unknown';
        const lines = labelText.split(' ');
  
        lines.forEach((line, index) => {
          textElement.append('tspan')
            .attr('x', d => textElement.attr('x'))
            .attr('dy', index === 0 ? 0 : '1.2em')
            .text(line);
        });
      });
  }

  getAdjustedXPosition(d) {
    const state = this.stateProperties.states.find(state => state.persianName === d.properties.name);
    const defaultX = this.path.centroid(d)[0];
    if (state && state.position && state.position[0] !== undefined) {
      return defaultX + state.position[0];
    }
    return defaultX;
  }

  getAdjustedYPosition(d) {
    const state = this.stateProperties.states.find(state => state.persianName === d.properties.name);
    const defaultY = this.path.centroid(d)[1];
    if (state && state.position && state.position[1] !== undefined) {
      return defaultY + state.position[1];
    }
    return defaultY;
  }

  getLabelFontSize(d) {
    const state = this.stateProperties.states.find(state => state.persianName === d.properties.name);
    return state ? state.fontSize : '10px';
  }

  getContrastColor(color) {
    const rgb = d3.rgb(color);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 125 ? 'black' : 'white';
  }

  createMetricSelector() {
    const metricSelectorContainer = document.createElement('div');
    metricSelectorContainer.classList.add('metric-selector-container');
  
    const metricLabel = document.createElement('label');
    metricLabel.textContent = 'نوع داده: ';
    metricLabel.setAttribute('for', 'metric-selector');
    metricSelectorContainer.appendChild(metricLabel);
  
    const metricDropdown = document.createElement('select');
    metricDropdown.id = 'metric-selector';
    
    Object.keys(this.statisticsData[0])
      .filter(key => key !== 'استان')
      .forEach(metric => {
        const option = document.createElement('option');
        option.value = metric;
        option.textContent = metric;
        metricDropdown.appendChild(option);
      });
  
    metricDropdown.addEventListener('change', (event) => {
      this.handleMetricChange(event.target.value);
    });
  
    metricSelectorContainer.appendChild(metricDropdown);
  
    this.shadowRoot.insertBefore(metricSelectorContainer, this.svg.node());
  }

  handleMetricChange(selectedMetric) {
    this.selectedMetric = selectedMetric;
  
    this.setupChoroplethMap(false);
    this.updateRegions();
  }
}

customElements.define('iran-map', IranMapComponent);
