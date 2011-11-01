require 'cgi'
require 'haml'
require 'oauth'
require 'sinatra'




class App < Sinatra::Application
  # The scenario to sign in:
  #
  # (1) Visit / (manual).
  # (2) Visit /sign_in (manual).
  # (3) Authorize this appliation at Twitter.
  # (4) Visit /after_signed_in (automatically redirected).
  # (5) Visit / (automatically redirected).

  disable :logging
  enable :sessions

  get '/' do
    haml :index
  end

  get '/after_signed_in' do
    halt 500, 'Request token is not set.' unless session[:request_token_token]
    halt 500, 'Request token is not set.' unless session[:request_token_secret]
    begin
      request_token = OAuth::RequestToken.new(
        consumer,
        session[:request_token_token],
        session[:request_token_secret],
      )
      access_token = request_token.get_access_token
      session[:access_token_token] = access_token.token
      session[:access_token_secret] = access_token.secret
      redirect to('/')
    rescue OAuth::Unauthorized
      halt 500, 'Failed to authorize.  Please retry.'
    end
  end

  before %r{^/api/} do
    halt 403, 'Authorization is required.' unless signed_in?
  end

  get '/api/:version/*.:format' do |version, api_name, format|
    call_twitter_api :get, version, api_name, format
  end

  post '/api/:version/*.:format' do |version, api_name, format|
    call_twitter_api :post, version, api_name, format
  end

  get '/sign_in' do
    # For localhost:
    #   $ export TWITTER_OAUTH_CONSUMER_KEY=...
    #   $ export TWITTER_OAUTH_CONSUMER_SECRET=...
    #   $ rackup
    #
    # For heroku:
    #   $ heroku config:add TWITTER_OAUTH_CONSUMER_KEY=...
    #   $ heroku config:add TWITTER_OAUTH_CONSUMER_SECRET=...
    #   $ rake deploy
    request_token = consumer.get_request_token :oauth_callback => callback_url

    session[:request_token_token] = request_token.token
    session[:request_token_secret] = request_token.secret
    session[:access_token_token] = nil
    session[:access_token_secret] = nil

    redirect request_token.authorize_url :oauth_callback => callback_url
  end

  get '/sign_out' do
    safe_keys = []
    h = {}
    safe_keys.each do |k|
      h[k] = session[k]
    end

    session.clear

    safe_keys.each do |k|
      session[k] = h[k]
    end

    redirect to('/')
  end

  def access_token
    OAuth::AccessToken.new(
      consumer,
      session[:access_token_token],
      session[:access_token_secret]
    )
  end

  def call_twitter_api(method, version, api_name, format)
    parameters =
      request.params.
      to_a.
      map {|key, value| key + '=' + CGI.escape(value)}.
      join '&'
    response = access_token.request(
      method,
      "http://api.twitter.com/#{version}/#{api_name}.#{format}?#{parameters}"
    )
    [
      response.code.to_i,
      response.header.to_hash.keep_if {|k, _| k.downcase != 'status'},
      response.body
    ]
  end

  def callback_url
    url('/after_signed_in')
  end

  def consumer
    OAuth::Consumer.new(
      consumer_key,
      consumer_secret,
      :site => 'https://api.twitter.com/'
    )
  end

  def consumer_key
    ENV['TWITTER_OAUTH_CONSUMER_KEY'] ||
      halt(500, 'consumer_key is not set')
  end

  def consumer_secret
    ENV['TWITTER_OAUTH_CONSUMER_SECRET'] ||
      halt(500, 'consumer_secret is not set')
  end
end




__END__
# vim: foldmethod=marker
