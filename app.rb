require 'cgi'
require 'haml'
require 'oauth'
require 'sinatra'




class App < Sinatra::Application
  disable :logging
  enable :sessions

  before %r{^(?!/(sign_in|sign_out)$)} do
    s = session

    if not (s[:request_token_token] and s[:request_token_secret]) then
      deny_unauthorized_access
    end

    if not (s[:access_token_token] and s[:access_token_secret]) then
      begin
        request_token = OAuth::RequestToken.new(
          consumer,
          s[:request_token_token],
          s[:request_token_secret],
        )
        access_token = request_token.get_access_token
        s[:access_token_token] = access_token.token
        s[:access_token_secret] = access_token.secret
        redirect to('/')
      rescue OAuth::Unauthorized
        deny_unauthorized_access
      end
    end
  end

  get '/' do
    haml :index
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
    url('/')
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

  def deny_unauthorized_access
    if request.path_info.start_with? '/api'
      halt 403
    else
      redirect to('/about')
    end
  end
end




__END__
# vim: foldmethod=marker
