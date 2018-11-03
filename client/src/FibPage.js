import React from 'react';

export default class FibPage extends React.Component {
  state = {
    seenIndexes: [],
    values: {},
    index: '',
  };

  async componentDidMount() {
    try {
      await Promise.all([
        this.fetchValues(),
        this.fetchIndexes(),
      ]);
    } catch (err) {
      console.error(err);
    }
  }

  async fetchValues() {
    const res = await fetch('/api/values/current');
    const { values } = await res.json();
    this.setState({
      values,
    });
  }

  async fetchIndexes() {
    const res = await fetch('/api/values/all');
    const { values } = await res.json();
    this.setState({
      seenIndexes: values,
    });
  }

  handleSubmit = async (event) => {
    event.preventDefault();

    await fetch('/api/values', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        index: this.state.index,
      }),
    });

    this.setState({ index: '' });
  }

  renderSeenIndexes() {
    return this.state.seenIndexes.map(({ number }) => number).join(', ');
  }

  renderValues() {
    const entries = [];

    for (let key in this.state.values) {
      entries.push(
        <div key={key}>
          For index {key} I calculated {this.state.values[key]}
        </div>
      );
    }

    return entries;
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <label>Enter your index</label>
          <input value={this.state.index} onChange={event => this.setState({ index: event.target.value })} type="number" />
          <button>Submit</button>
        </form>

        <h3>Indexes I have seen:</h3>
        {this.renderSeenIndexes()}

        <h3>Calculated values:</h3>
        {this.renderValues()}
      </div>
    );
  }
}
