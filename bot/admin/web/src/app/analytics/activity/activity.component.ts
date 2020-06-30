import {Component} from '@angular/core';
import {UserAnalyticsQueryResult, UserSearchQuery} from "../users/users";
import {DialogFlowRequest} from "../flow/flow";
import {SelectBotEvent} from "../../shared/select-bot/select-bot.component";
import {StateService} from 'src/app/core-nlp/state.service';
import {AnalyticsService} from '../analytics.service';
import {BotConfigurationService} from 'src/app/core/bot-configuration.service';
import {PaginatedQuery} from 'src/app/model/commons';
import {Observable} from 'rxjs';
import {UserFilter} from '../users/users.component';
import {ChartData} from '../chart/ChartData';
import {BotApplicationConfiguration, ConnectorType} from 'src/app/core/model/configuration';
import * as html2pdf from 'html2pdf.js'

@Component({
  selector: 'tock-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.css']
})
export class ActivityComponent {

  startDate: Date;
  endDate: Date;
  selectedConnectorId: string;
  selectedConfigurationName: string;
  displayTests = true;
  pretty = true;
  stacked = false;

  filter: UserFilter = new UserFilter([], false);
  loadingUsers: boolean = false;
  usersChart: ChartData;

  messagesByType: UserAnalyticsQueryResult;
  messagesByStory: UserAnalyticsQueryResult;
  messagesByIntent: UserAnalyticsQueryResult;
  messagesByConfiguration: UserAnalyticsQueryResult;
  messagesByConnector: UserAnalyticsQueryResult;

  globalUsersCount: number[];
//   globalMessagesCount: number[];
  configurations: BotApplicationConfiguration[];
  connectors: string[];

  constructor(private state: StateService,
              private analytics: AnalyticsService,
              private botConfiguration: BotConfigurationService) {
    this.botConfiguration.configurations.subscribe(configs => {
        this.configurations = configs;
      }
    )
  }

  getConnectorColor(connector: string): string {
    let color;
    switch(connector) {
      case "messenger": {
        color = "#0084ff";
        break;
      }
      case "ga": {
        color = "#fabc05";
        break;
      }
      case "alexa": {
        color = "#3dc3ef";
        break;
      }
      case "slack": {
        color = "#e01f5c";
        break;
      }
      case "rocket": {
        color = "#dc2727";
        break;
      }
      case "twitter": {
        color = "#1ca3f3";
        break;
      }
      case "whatsapp": {
        color = "#41c352";
        break;
      }
      case "teams": {
        color = "#5d67cf";
        break;
      }
      case "businesschat": {
        color = "#58e951";
        break;
      }
      case "web": {
        color = "#878f9c";
        break;
      }
      default: {
        color = "#f3745d";
        break;
      }
    }
    return color;
  }

  getFileName():string{
    let fileName = "Export-" + this.startDate.toLocaleDateString();
    if(this.endDate != null){
      fileName+="-" + this.endDate.toLocaleDateString();
    }
    fileName += ".pdf";
    return fileName;
  }

  onPdfAction() {
    const options = {
      filename: this.getFileName(),
      image: {type: 'jpeg ', quality: 0.95},
      html2canvas: {},
      jsPDF: {orientation: 'landscape'}
    };
    const content: Element = document.getElementById('element-id');
    html2pdf()
      .from(content)
      .set(options)
      .save()
  }

  getConnector(connectorId: string): ConnectorType {
    let connectors = this.configurations.filter(config => config.connectorType.id === connectorId).map(config => config.connectorType)
    return connectors && connectors.length > 0 ? connectors[0] : null
  }

  findUsers(query: PaginatedQuery): Observable<UserAnalyticsQueryResult> {
    return this.analytics.usersAnalytics(this.buildUserSearchQuery(query));
  }

  private reload() {
    let that = this;
    this.loadingUsers = true;
    if (this.startDate != null) {
      this.filter.from = this.startDate;
      this.filter.to = this.endDate;
//       this.usersGraph(that);
      this.buildMessagesCharts();
      this.buildMessagesByStoryCharts();
      this.buildMessagesByIntentCharts();
      this.buildMessagesByConfigurationCharts();
      this.buildMessagesByConnectorCharts();
    }
  }

  private usersGraph(that: this) {
    this.findUsers(this.state.createPaginatedQuery(0)).subscribe(
      result => {
        this.connectors = result.connectorsType;
        let graphdata = [];

        result.dates.forEach(function (date, index) {
          graphdata.push([date].concat(result.usersData[index]))
        });
        this.globalUsersCount = new Array(this.connectors.length).fill(0);
        result.usersData.forEach(function (userData) {
          that.connectors.forEach(function (value, index,) {
            that.globalUsersCount[index] += userData[index]
          })
        })
        let columnNames = ["Day"].concat(this.connectors.map((c, i) => c + "  " + this.globalUsersCount[i]))
        let connectorColor = this.connectors.map(connectorType => that.getConnectorColor(connectorType))
        let options = {
          legend: {position: 'right'},
          colors: connectorColor,
          pointSize: 5, is3D: true
        };
        this.usersChart = new ChartData("LineChart", graphdata, columnNames, options, '500', '1000');
        this.loadingUsers = false;
      }
    )
  }

  private buildMessagesCharts() {
    this.analytics.messagesAnalytics(this.buildMessagesSearchQuery()).subscribe(
      result => {
        this.connectors = result.connectorsType;
        this.messagesByType = result;
        this.loadingUsers = false;
      }
    )
  }

  private buildMessagesByStoryCharts() {
    this.analytics.messagesAnalyticsByDateAndStory(this.buildMessagesSearchQuery()).subscribe(
      result => {
        this.messagesByStory = result;
        this.loadingUsers = false;
      }
    )
  }

  private buildMessagesByIntentCharts() {
    this.analytics.messagesAnalyticsByDateAndIntent(this.buildMessagesSearchQuery()).subscribe(
      result => {
        this.messagesByIntent = result;
        this.loadingUsers = false;
      }
    )
  }

  private buildMessagesByConfigurationCharts() {
    this.analytics.messagesAnalyticsByConfiguration(this.buildMessagesSearchQuery()).subscribe(
      result => {
        this.messagesByConfiguration = result;
        this.loadingUsers = false;
      }
    )
  }

  private buildMessagesByConnectorCharts() {
    this.analytics.messagesAnalyticsByConnectorType(this.buildMessagesSearchQuery()).subscribe(
      result => {
        this.messagesByConnector = result;
        this.loadingUsers = false;
      }
    )
  }

  private buildUserSearchQuery(query: PaginatedQuery): UserSearchQuery {
    return new UserSearchQuery(
      query.namespace,
      query.applicationName,
      query.language,
      query.start,
      query.size,
      null,
      this.filter.from,
      this.filter.to,
      this.filter.flags,
      this.filter.displayTests);
  }

  private buildMessagesSearchQuery(): DialogFlowRequest {
    return new DialogFlowRequest(
      this.state.currentApplication.namespace,
      this.state.currentApplication.name,
      this.state.currentLocale,
      this.state.currentApplication.name,
      this.selectedConfigurationName,
      this.selectedConnectorId,
      this.filter.from,
      this.filter.to,
      this.displayTests
    );
  }

  datesChanged(dates: [Date, Date]) {
    this.startDate = dates[0];
    this.endDate = dates[1];
    this.reload();
  }

  selectedConfigurationChanged(event?: SelectBotEvent) {
    this.selectedConfigurationName = !event ? null : event.configurationName;
    this.selectedConnectorId = !event ? null : event.configurationId;
    this.reload();
  }

  waitAndRefresh() {
    setTimeout(_ => this.reload());
  }
}