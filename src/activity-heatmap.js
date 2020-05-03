
class ActivityHeatmap {
    
  constructor (data, options = {}, profile = 'yearly') {
    this.data = data;
    this.profile = profile;
    this.__options(options);
  }

  render() {
    this.init();

    let svg = this.svg();
    
    if (this.options.frame) this.renderFrame(svg);
    if (this.options.debug) this.renderBlueprints(svg);
    this.renderHeatmap(svg);
    if (this.options.histogram) this.renderHistogram(svg);
  }
  
  renderHeatmap(svg) {
    let w = this.geometry.heatmap.box.width;
    let h = this.geometry.heatmap.box.height;
    let l = this.geometry.heatmap.box.left;
    let t = this.geometry.heatmap.box.top;
    let tsw = this.geometry.square.width + this.geometry.square.padding;
    let tsh = this.geometry.square.height + this.geometry.square.padding;
    
    let color = d3.scaleLinear()
      .range(this.options.colors.scale)
      .domain(this.heatmap.scale);
    
    let heatmap = svg.append('g')
      .attr('class', 'heatmap');
  
    let cells = heatmap.selectAll('.cell')
      .data(this.heatmap.data);
  
    let enterSelection = cells.enter().append('rect')
      .attr('class', 'cell')
      .attr('width', this.geometry.square.width)
      .attr('height', this.geometry.square.height)
      .attr('fill', d => color(d.value))
      .attr('x', d => d.ci * tsw + l)
      .attr('y', d => d.ri * tsh + t);
  
    if (this.options.tooltip) {
      enterSelection.merge(cells).on('mouseover', (d, i) => {
        this.tooltip = d3.select(this.options.selector)
          .append('div')
          .attr('class', 'heatmap-tooltip')
          .html(this.tooltipHTML(d.value, moment(d.date).format(this.options.tooltip.heatmap)))
          .style('left', () => ((d.ci * tsw + l + this.geometry.tooltip.left) + 'px'))
          .style('top', () => ((d.ri * tsh + t + this.geometry.tooltip.top) + 'px'))
          ;
      })
      .on('mouseout', (d, i) => {
        this.tooltip.remove();
      });
    }
    cells.exit().remove();
    
    if (this.options.legend) {
      this.renderLegend(
          svg,
          this.heatmap.scale,
          this.geometry.heatmap.legend);
    }
    if (this.options.labels.cols) this.renderColsLabels(svg);
    if (this.options.labels.rows) this.renderRowsLabels(svg);
  }

  renderHistogram(svg) {
    let w = this.geometry.histogram.box.width;
    let h = this.geometry.histogram.box.height;
    let l = this.geometry.histogram.box.left;
    let t = this.geometry.histogram.box.top;
    let tsw = this.geometry.square.width + this.geometry.square.padding;
    
    let color = d3.scaleLinear()
      .range(this.options.colors.scale)
      .domain(this.histogram.scale);
    
    let histogram = svg.append('g')
      .attr('class', 'histogram');
  
    let bars = histogram.selectAll('.bar')
      .data(this.histogram.data);
  
    let fh = d => Math.abs(this.histogram.scale[1] - this.histogram.scale[0]) ? h * Math.abs(d.value - this.histogram.scale[0]) / Math.abs(this.histogram.scale[1] - this.histogram.scale[0]) : 0;
    let enterSelection = bars.enter().append('rect')
      .attr('class', 'bar')
      .attr('width', this.geometry.square.width)
      .attr('height', fh)
      .attr('fill', d => color(d.value))
      .attr('x', d => d.i * tsw + l)
      .attr('y', d => h + t - fh(d) );
  
    if (this.options.tooltip) {
      enterSelection.merge(bars).on('mouseover', (d, i) => {
        this.tooltip = d3.select(this.options.selector)
          .append('div')
          .attr('class', 'heatmap-tooltip')
          .html(this.tooltipHTML(d.value, moment(d.date).format(this.options.tooltip.histogram)))
          .style('left', () => ((d.i * tsw + l + this.geometry.tooltip.left) + 'px'))
          .style('top', () => ((t + this.geometry.tooltip.top) + 'px'))
          ;
      })
      .on('mouseout', (d, i) => {
        this.tooltip.remove();
      });
    }
    bars.exit().remove();
    
    if (this.options.legend) {
      this.renderLegend(
          svg,
          this.histogram.scale,
          this.geometry.histogram.legend);
    }
  }

  
  renderLegend(svg, scale, geometry) {
    let w = geometry.box.width;
    let h = geometry.box.height;
    let l = geometry.box.left;
    let t = geometry.box.top;
    let color = d3.scaleLinear()
      .range(this.options.colors.scale)
      .domain(scale);
    
    let colorScale = this.linearRange(scale[1], scale[0], h);
    let legend = svg.append('g');
    legend
      .attr('class', 'legend');
    
    legend.selectAll('.legend-step')
        .data(colorScale)
        .enter().append('rect')
          .attr('class', 'legend-step')
          .attr('width', geometry.width)
          .attr('height', 1)
          .attr('x', l)
          .attr('y', (d, i) => i + t)
          .attr('fill', d => color(d));

    legend.append('text')
      .attr('class', 'high')
      .attr('font-size', this.options.fontSize)
      .attr('x', l + geometry.width + geometry.label.padding)
      .attr('y', this.options.fontSize + t)
      .text(scale[1]);
    
    legend.append('text')
      .attr('class', 'high')
      .attr('font-size', this.options.fontSize)
      .attr('x', l + geometry.width + geometry.label.padding)
      .attr('y', h + t)
      .text(scale[0]);

  }
  
  renderColsLabels(svg) {
    let w = this.geometry.labels.cols.box.width;
    let h = this.geometry.labels.cols.box.height;
    let l = this.geometry.labels.cols.box.left;
    let t = this.geometry.labels.cols.box.top;
    
    let colsLabels = svg.append('g');
    colsLabels
      .attr('class', 'cols-labels');
    
    let cols = this.prepareLabelsSpecs(this.options.labels.cols, 'cols');
    let colsData = this.prepareLabelsData(cols);
    
    let enter = colsLabels.selectAll('.col-label')
      .data(colsData)
      .enter();
    
    if (cols.separator) {
      let y2 = t + h;
      if (this.options.histogram) {
        y2 = this.geometry.histogram.box.top + this.geometry.histogram.box.height;
      }
      let fx = d => w * d.i / cols.length + l;
      enter.append("line")
        .style("stroke", cols.separator.color)
        .style("stroke-width", cols.separator.thickness)
        .attr("x1", fx)
        .attr("y1", this.geometry.heatmap.box.top)
        .attr("x2", fx)
        .attr("y2", y2);
    }
    
    enter.append('text')
        .attr('class', 'col-label')
        .attr('font-size', this.options.fontSize)
//        .attr('dominant-baseline', 'hanging')
        .attr('height', h)
//        .attr('x', d => cw * d.i / cols.length + l + (cols.separator ? 1 : 0)) // d.i has the original linear index
        .attr('x', d => w * d.i / cols.length + l + (cols.separator ? 1 : 0)) // d.i has the original linear index
        .attr('y', t + h)
        .text(cols.label);
    
  }
  
  renderRowsLabels (svg) {
    let w = this.geometry.labels.rows.box.width;
    let l = this.geometry.labels.rows.box.left;
    let t = this.geometry.labels.rows.box.top;
    let h = this.geometry.labels.rows.box.height;
    
    let rowsLabels = svg.append('g');
    rowsLabels
      .attr('class', 'rows-labels');
    
    let rows = this.prepareLabelsSpecs(this.options.labels.rows, 'rows');
    let rowsData = this.prepareLabelsData(rows);
    
    let enter = rowsLabels.selectAll('.row-label')
      .data(rowsData)
      .enter();
      
    if (rows.separator) {
      let fy = d => ch * d.i / rows.length + t;
      enter.append("line")
        .style("stroke", rows.separator.color)
        .style("stroke-width", rows.separator.thickness)
        .attr("x1", l)
        .attr("y1", fy)
        .attr("x2", this.geometry.heatmap.box.left)
        .attr("y2", fy);
    }
    
    enter.append('text')
      .attr('class', 'row-label')
      .attr('text-anchor', 'end')
      .attr('font-size', this.options.fontSize)
      .attr('width', this.geometry.labels.rows.label.width)
      .attr('height', h / rows.length)
      .attr('x', l + this.geometry.labels.rows.label.width)
      .attr('y', d => h * d.i / rows.length + t + this.geometry.square.height)
      .text(d => d.label);
  }
  
  renderFrame (svg) {
    svg.append('rect')
      .style("stroke", this.options.colors.frame)
      .style("fill-opacity", "0.0")
      .style("stroke-width", "1")
      .attr('width', this.geometry.width)
      .attr('height', this.geometry.height)
      .attr('x', 0)
      .attr('y', 0);
  }
  
  renderBlueprints (svg) {
    let blueprints = svg.append('g')
      .attr('class', 'blueprints')
      .style("stroke", "blue")
      .style("stroke-opacity", "0.5")
      .style("fill-opacity", "0.0")
      .style("stroke-width", "2")
      .style("stroke-dasharray", "5,5")
    ;
    blueprints.append('rect')
      .attr('width', this.geometry.width)
      .attr('height', this.geometry.height)
      .attr('x', 0)
      .attr('y', 0);

    blueprints.append('rect')
    .attr('width', this.geometry.heatmap.box.width)
    .attr('height', this.geometry.heatmap.box.height)
    .attr('x', this.geometry.heatmap.box.left)
    .attr('y', this.geometry.heatmap.box.top);
    
    if (this.options.histogram) {
      blueprints.append('rect')
        .attr('width', this.geometry.histogram.box.width)
        .attr('height', this.geometry.histogram.box.height)
        .attr('x', this.geometry.histogram.box.left)
        .attr('y', this.geometry.histogram.box.top);
    }
    if (this.options.legend) {
      blueprints.append('rect')
        .attr('width', this.geometry.heatmap.legend.box.width)
        .attr('height', this.geometry.heatmap.legend.box.height)
        .attr('x', this.geometry.heatmap.legend.box.left)
        .attr('y', this.geometry.heatmap.legend.box.top);
      if (this.options.histogram) {
        blueprints.append('rect')
        .attr('width', this.geometry.histogram.legend.box.width)
        .attr('height', this.geometry.histogram.legend.box.height)
        .attr('x', this.geometry.histogram.legend.box.left)
        .attr('y', this.geometry.histogram.legend.box.top);
      }
    }
    if (this.options.labels.cols) {
      blueprints.append('rect')
        .attr('width', this.geometry.labels.cols.box.width)
        .attr('height', this.geometry.labels.cols.box.height)
        .attr('x', this.geometry.labels.cols.box.left)
        .attr('y', this.geometry.labels.cols.box.top);
    }
    if (this.options.labels.rows) {
      blueprints.append('rect')
        .attr('width', this.geometry.labels.rows.box.width)
        .attr('height', this.geometry.labels.rows.box.height)
        .attr('x', this.geometry.labels.rows.box.left)
        .attr('y', this.geometry.labels.rows.box.top);
    }
  }
  
  svg () {
    d3.select(this.options.selector).selectAll('svg.calendar-heatmap').remove(); // remove the existing chart, if it exists
    
    let svg = d3.select(this.options.selector)
      .style('position', 'relative')
      .append('svg')
      .attr('class', 'container-heatmap')
      .attr('width', this.geometry.width)
      .attr('height', this.geometry.height);
    
    return svg;
  }

  tooltipHTML (value, tag) {
    if (tag == null) tag = '';
    return `<span><strong>${value}</strong> ${tag}</span>`;
  }

  timeRange (from, to, granularity) {
    switch (granularity) {
      case 'year':
        return d3.timeYears(from, to);
      case 'month':
        return d3.timeMonths(from, to);
      case 'week':
        return d3.timeWeeks(from, to);
      case 'day':
        return d3.timeDays(from, to);
      case 'hour':
        return d3.timeHours(from, to);
    }
  }
  
  fullHeatmapStruct (item) {
    item = Object.assign(item, this.options.struct(item));
    if (item.ci == null) item.ci = this.heatmap.cols.findIndex(x => x.valueOf() === item.col.valueOf());
    if (item.col == null) item.col = this.heatmap.cols[item.ci];
    if (item.ri == null) item.ri = this.heatmap.rows.findIndex(x => x.valueOf() === item.row.valueOf());
    if (item.row == null) item.row = this.heatmap.rows[item.ri];
    return item;
  }

  init () {
    this.initOptions();
    this.initHeatmap();
    if (this.options.histogram) this.initHistogram();
    this.initGeometry();
  }
  
  initOptions () {
    // init options
    if (!this.options.period.from && !this.options.period.to) {
      this.options.period.to = moment().toDate();
    }
    if (!Array.isArray(this.options.period.range)) {
      // range is a number of days
      this.options.period.range = [this.options.period.range, 'days'];
    }
    if (!this.options.period.from) {
      this.options.period.from = moment(this.options.period.to).subtract(...this.options.period.range).toDate();
    }
    if (!this.options.period.to) {
      this.options.period.to = moment(this.options.period.from).add(...this.options.period.range).toDate();
    }
    
    // fix period to snap to granularity
    this.options.period.from = moment(this.options.period.from).startOf(this.options.period.granularity.col).startOf(this.options.period.granularity.cell).toDate();
    this.options.period.to = moment(this.options.period.to).endOf(this.options.period.granularity.col).endOf(this.options.period.granularity.cell).toDate();
    
    if (this.options.debug) console.log(this.options);
  }
  
  initGeometry () {
    // geometry is using paddings and cell dimensions as bases
    
    this.geometry = this.options.geometry;
    
    if (!isNaN(this.geometry.margin)) {
      let margin = this.geometry.margin;
      this.geometry.margin = {
          top: margin,
          bottom: margin,
          left: margin,
          right: margin,
      };
    }
    
    // heatmap width and height
    if (!this.geometry.heatmap.box.width) {
      this.geometry.heatmap.box.width = this.heatmap.cols.length * (this.geometry.square.width + this.geometry.square.padding) - this.geometry.square.padding;
    }
    if (!this.geometry.heatmap.box.height) {
      this.geometry.heatmap.box.height = this.heatmap.rows.length * (this.geometry.square.height + this.geometry.square.padding) - this.geometry.square.padding;
    }
    
    // histogram width
    if (this.options.histogram) {
      this.geometry.histogram.box.width = this.geometry.heatmap.box.width;
    }
    
    // legends width and height
    if (this.options.legend) {
      this.geometry.heatmap.legend.width = this.geometry.square.width;
      this.geometry.heatmap.legend.box.width = this.geometry.heatmap.legend.width + this.geometry.heatmap.legend.box.padding + this.geometry.heatmap.legend.label.width;
      this.geometry.heatmap.legend.box.height = this.geometry.heatmap.box.height;
      if (this.options.histogram) {
        this.geometry.histogram.legend.width = this.geometry.square.width;
        this.geometry.histogram.legend.box.width = this.geometry.histogram.legend.width + this.geometry.histogram.legend.box.padding + this.geometry.histogram.legend.label.width;
        this.geometry.histogram.legend.box.height = this.geometry.histogram.box.height;
      }
    }
    
    // labels width and height
    if (this.options.labels.cols) {
      this.geometry.labels.cols.box.width = this.geometry.heatmap.box.width;
      this.geometry.labels.cols.box.height = this.geometry.labels.cols.label.height;
    }
    if (this.options.labels.rows) {
      this.geometry.labels.rows.box.width = this.geometry.labels.rows.label.width;
      this.geometry.labels.rows.box.height = this.geometry.heatmap.box.height;
    }
    
    // heatmap position
    this.geometry.heatmap.box.left = this.geometry.margin.left;
    this.geometry.heatmap.box.top = this.geometry.margin.top;
    let h = this.geometry.heatmap.box.top + this.geometry.heatmap.box.height;
    
    if (this.options.labels.rows) this.geometry.heatmap.box.left += this.geometry.labels.rows.box.width + this.geometry.labels.rows.box.padding;
    
    // labels position
    if (this.options.labels.cols) {
      this.geometry.labels.cols.box.left = this.geometry.heatmap.box.left;
      this.geometry.labels.cols.box.top = h + this.geometry.labels.cols.box.padding;
      h += this.geometry.labels.cols.box.padding + this.geometry.labels.cols.box.height;
    }
    if (this.options.labels.rows) {
      this.geometry.labels.rows.box.left = this.geometry.margin.left;
      this.geometry.labels.rows.box.top = this.geometry.heatmap.box.top;
    }

    // histogram position
    if (this.options.histogram) {
      this.geometry.histogram.box.left = this.geometry.heatmap.box.left;
      this.geometry.histogram.box.top = h + this.geometry.histogram.box.padding;
      h += this.geometry.histogram.box.padding + this.geometry.histogram.box.height;
    }
    
    // legends position
    if (this.options.legend) {
      this.geometry.heatmap.legend.box.left = this.geometry.heatmap.box.left + this.geometry.heatmap.box.width + this.geometry.heatmap.legend.box.padding;
      this.geometry.heatmap.legend.box.top = this.geometry.heatmap.box.top;
      if (this.options.histogram) {
        this.geometry.histogram.legend.box.left = this.geometry.histogram.box.left + this.geometry.histogram.box.width + this.geometry.histogram.legend.box.padding;
        this.geometry.histogram.legend.box.top = this.geometry.histogram.box.top;
      }
    }
    
    // global width and height
    if (!this.geometry.width) {
      this.geometry.width = this.geometry.heatmap.box.width + this.geometry.margin.left + this.geometry.margin.right;
      if (this.options.labels.rows) this.geometry.width += this.geometry.labels.rows.box.width + this.geometry.labels.rows.box.padding;
      if (this.options.legend) {
        let w = this.geometry.heatmap.legend.box.width + this.geometry.heatmap.legend.box.padding;
        if (this.options.histogram) {
          w = Math.max(w, this.geometry.histogram.legend.box.width + this.geometry.histogram.legend.box.padding);
        }
        this.geometry.width += w;
      }
    }
    
    if (!this.geometry.height) {
      this.geometry.height = this.geometry.heatmap.box.height + this.geometry.margin.top + this.geometry.margin.bottom;
      if (this.options.labels.cols) this.geometry.height += this.geometry.labels.cols.box.height + this.geometry.labels.cols.box.padding;
      if (this.options.histogram) this.geometry.height += this.geometry.histogram.box.height + this.geometry.histogram.box.padding;
    }
    
    if (this.options.debug) console.log(this.geometry);
  }
  
  initHeatmap () {
    
    this.heatmap = {
        cols: typeof this.options.cols === 'function' ? this.options.cols() : this.options.cols,
        rows: typeof this.options.rows === 'function' ? this.options.rows() : this.options.rows,
    };
    
    this.heatmap.ciri2i = (ci, ri) => ri * this.heatmap.cols.length + ci;
    this.heatmap.d2i = d => {
      if (d.i != null) return d.i;
      let ci = d.ci;
      if (ci == null) ci = this.heatmap.cols.findIndex(x => x.valueOf() === d.col.valueOf());
      let ri = d.ri;
      if (ri == null) ri = this.heatmap.rows.findIndex(x => x.valueOf() === d.col.valueOf());
      if ( ci >= 0 && ri >= 0 ) return this.heatmap.ciri2i(ci, ri);
      return -1;
    };
    
    // create empty dataset
    this.heatmap.data = this.timeRange(this.options.period.from, this.options.period.to, this.options.period.granularity.cell);
    this.heatmap.data.forEach((item, i, self) => {
      self[i] = this.fullHeatmapStruct({
        date: item,
        value: 0,
        i,
      });
    });
    
    // aggregate external data into dataset
    this.data.forEach(item => {
      let d = this.options.struct(item);
      let i = this.heatmap.d2i(d);
      if ( this.heatmap.data[i] ) {
        this.heatmap.data[i].value += d.value;
      }
    });

    // adjust value scale
    this.heatmap.scale = [...this.options.scale];
    if (this.heatmap.scale[0] == null) this.heatmap.scale[0] = d3.min(this.heatmap.data, d => d.value);
    if (this.heatmap.scale[1] == null) this.heatmap.scale[1] = d3.max(this.heatmap.data, d => d.value);
    
    if (this.options.debug) console.log(this.heatmap);
  }
  
  initHistogram () {
    this.histogram = {};
    
    this.histogram.data = this.timeRange(this.options.period.from, this.options.period.to, this.options.period.granularity.col);
    this.histogram.data.forEach((item, i, self) => {
      self[i] = {
        date: item,
        value: 0,
        i,
      };
    });
    
    // aggregate heatmap data into dataset
    this.heatmap.data.forEach(item => {
      this.histogram.data[item.ci].value += item.value;
    });

    // adjust value scale
    this.histogram.scale = [...this.options.scale];
    if (this.histogram.scale[0] == null) this.histogram.scale[0] = d3.min(this.histogram.data, d => d.value);
    if (this.histogram.scale[1] == null) this.histogram.scale[1] = d3.max(this.histogram.data, d => d.value);

  }
  
  __options (options, profile) {
    if (typeof options === 'string' || options instanceof String) {
      options = {selector: options};
    }
    
    let defaults = {
        debug: false,
        selector: null,
        legend: true,
        histogram: true,
        frame: true,
        geometry: {
          width: null,
          height: null,
          heatmap: {
            box: {},
            legend: {
              box: {padding: 5},
              label: {padding: 5, width: 20}
            },
          },
          histogram: {
            box: {padding: 10, height: 50},
            legend: {
              box: {padding: 5},
              label: {padding: 5, width: 20}
            },
          },
          square: {
            width: 11,
            height: 11,
            padding: 2,
          },
          tooltip: {
            left: 0,
            top: -30,
          },
          labels: {
            cols: {
              box: {padding: 5},
              label: {
                width: 20,
                height: 10,
              },
            },
            rows: {
              box: {padding: 5},
              label: {
                width: 20,
                height: 10,
              },
            },
          },
//          cols: {
//            height: 6,
//          },
          margin: 10,
        },
        period: {
          from: null,
          to: null,
          range: null,
          granularity: {
            cell: null,
            col: null,
          }
        },
        scale: [null, null],
        colors: {
          separator: '#AAAAAA',
          frame: '#AAAAAA',
          scale: ['#D8E6E7', '#218380'],
        },
        struct: item => ({
          /*
          //see profile
          i: ...,
          ci: ...
          col: ...,
          ri: ..., // row index
          row: ...
          colLabel: ...,
          rowLabel: ...,
          value: ...,
          */
        }),
        cols: null, //see profile
        rows: null, //see profile
        labels: {
          cols: null, //see profile
          rows: null, //see profile
        },
        fontSize: 10,
    };
    
    // shortcut for known profiles
    switch (this.profile) {
    
      case 'yearly':
        defaults.tooltip = { heatmap: 'ddd, MMM Do YYYY', histogram: '[Week] w YYYY'};
        defaults.period.range = [1, 'year'];
        defaults.period.granularity.cell = 'day';
        defaults.period.granularity.col = 'week';
        defaults.struct = item => ({
          // index in heatmap.data
          i: +moment(item.date).diff(moment(this.options.period.from), this.options.period.granularity.cell),
          // ci: ... col index
          col: moment(item.date).startOf(this.options.period.granularity.col).startOf(this.options.period.granularity.cell).toDate(),
          ri: +item.date.getDay(), // row index
          value: item.value,
        });
        defaults.cols = () => this.timeRange(this.options.period.from, this.options.period.to, this.options.period.granularity.col);
        defaults.rows = ['Sn', 'M', 'T', 'We', 'Th', 'F', 'S'];
        defaults.labels = {
          cols: {
            granularity: 'week',
            label: d => moment(d.date).endOf('week').format('MMM'), // display month of end of started week
            display: d => moment(d.date).endOf('week').isSame(moment(d.date).endOf('week').startOf('month'), 'week'), // display only in first week of month
            separator: true,
          },
          rows: true, // means take heatmap.rows
        };
        break;
      
      case 'monthly':
        defaults.tooltip = { heatmap: 'YYYY-MM-DD hh:mm', histogram: 'ddd, MMM Do YYYY' };
        defaults.period.range = [1, 'month'];
        defaults.period.granularity.cell = 'hour';
        defaults.period.granularity.col = 'day';
        defaults.struct = item => ({
          // index in heatmap.data
          i: +moment(item.date).diff(moment(this.options.period.from), this.options.period.granularity.cell),
          // ci: ... col index
          col: moment(item.date).startOf(this.options.period.granularity.col).startOf(this.options.period.granularity.cell).toDate(),
          ri: +item.date.getHours(), // row index
          value: item.value,
        });
        defaults.cols = () => this.timeRange(this.options.period.from, this.options.period.to, this.options.period.granularity.col);
        defaults.rows = [...Array(24).keys()];
        defaults.labels = {
            cols: {
              granularity: 'day',
              label: d => moment(d.date).date(), // display month of end of started week
              display: d => moment(d.date).day() == 0, // display only in first week of month
              separator: true,
            },
            rows: true, // means take heatmap.rows
          };
        break;
      
    }
    
    options = mergeDeep(defaults, options);
    
    this.options = options;
  }
  
  linearRange (from, to, steps) {
    let range = [];
    for (let i = 0; i < steps; i++) {
      range.push(from + (to - from) * i / (steps - 1));
    }
    return range;
  }
  
  prepareLabelsSpecs (specs, who) {
    if (true === specs) {
      // labels from cols/rows
      specs = {who};
      switch (who) {
      case 'rows':
        specs.data = this.heatmap.rows;
        break;
      case 'cols':
        specs.data = this.heatmap.cols;
        break;
      }
    } else if (Array.isArray(specs)) {
      // basic array of string
      specs = {who};
      specs.data = specs;
    } else {
      specs.who = who;
    }
    if (specs.separator) {
      if (specs.separator === true) specs.separator = {};
      specs.separator.color = specs.separator.color != null ? specs.separator.color : this.options.colors.separator;
      specs.separator.thickness = specs.separator.thickness != null ? specs.separator.thickness : 1;
    }
    return specs;
  }
  
  prepareLabelsData (specs) {
    let data;
    
    if (specs.granularity) {
      data = this.timeRange(this.options.period.from, this.options.period.to, specs.granularity);
      data.forEach((item, i, self) => {
        self[i] = {
          date: item,
          i,
        };
      });
    // the variable is defined
    } else if (specs.data) {
      // basic array of string
      data = specs.data;
      data.forEach((item, i, self) => {
        self[i] = {
          label: item,
          i,
        };
      });
    }
    specs.length = data.length;
    
    if (specs.display) {
      // some display rules
      let newData = [];
      data.forEach((item) => {
        if (specs.display(item)) newData.push(item);
      });
      data = newData;
    }
    
    return data;
  }
}

function mergeDeep (...objects) {
  const isObject = obj => obj && typeof obj === 'object';
  
  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach(key => {
      const pVal = prev[key];
      const oVal = obj[key];
      
      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        //prev[key] = pVal.concat(...oVal);
        prev[key] = oVal;
      }
      else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = mergeDeep(pVal, oVal);
      }
      else {
        prev[key] = oVal;
      }
    });
    
    return prev;
  }, {});
}
